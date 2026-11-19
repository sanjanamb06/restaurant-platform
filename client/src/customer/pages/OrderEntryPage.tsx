import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  PublicMenu,
  PublicOrder,
  checkTable,
  createPublicOrder,
  getPublicApiError,
  getPublicMenu,
  getPublicOrder,
  getPublicTables,
  joinPublicOrder,
} from "../api/publicOrder.api";
import ActiveOrderPrompt from "../components/ActiveOrderPrompt";
import CartDrawer from "../components/CartDrawer";
import CustomerMenu from "../components/CustomerMenu";
import DetailsForm from "../components/DetailsForm";
import OrderConfirmation from "../components/OrderConfirmation";
import WelcomeBackCard from "../components/WelcomeBackCard";
import { CartProvider, useCart } from "../context/CartContext";
import {
  GuestSession,
  clearGuestSession,
  getGuestSession,
  setGuestSession,
} from "../utils/guestSession";

type Step = "welcome" | "details" | "active-order" | "menu" | "confirmation";
type OrderMode = "create" | "join";

/** Statuses that mean the order is still in progress and a session is valid. */
const ACTIVE_ORDER_STATUSES = ["PENDING", "PREPARING"] as const;

function isActiveStatus(status: string): boolean {
  return (ACTIVE_ORDER_STATUSES as readonly string[]).includes(status);
}

function OrderEntryContent({ restaurantId }: { restaurantId: string }) {
  const cart = useCart();
  const [step, setStep] = useState<Step>("details");
  const [session, setSession] = useState<GuestSession | null>(null);
  const [menu, setMenu] = useState<PublicMenu | null>(null);
  const [tableNumbers, setTableNumbers] = useState<number[]>([]);
  const [tablesFailed, setTablesFailed] = useState(false);
  const [activeOrder, setActiveOrder] = useState<PublicOrder | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<PublicOrder | null>(null);
  const [mode, setMode] = useState<OrderMode>("create");
  const [cartOpen, setCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingTable, setIsCheckingTable] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  // ---------------------------------------------------------------------------
  // Bug 3 fix: validate stored session against the backend on every page load.
  // Never show "Continue session" for an order that is READY, CANCELLED, or gone.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function validateAndRestoreSession() {
      const savedSession = getGuestSession(restaurantId);

      if (!savedSession) {
        setIsLoading(false);
        return;
      }

      // If there is no activeOrderId we cannot validate — treat as fresh start.
      if (!savedSession.activeOrderId) {
        clearGuestSession(restaurantId);
        setIsLoading(false);
        return;
      }

      try {
        const result = await getPublicOrder(restaurantId, savedSession.activeOrderId);
        const order = result.order;

        if (isActiveStatus(order.status)) {
          // Order is still PENDING or PREPARING — offer the welcome-back card.
          setSession(savedSession);
          setActiveOrder(order);
          setStep("welcome");
        } else {
          // Bug 2 fix: order is READY or CANCELLED — auto-clear the stale session.
          clearGuestSession(restaurantId);
        }
      } catch {
        // Order not found (404) or network error — treat as stale and reset.
        clearGuestSession(restaurantId);
      } finally {
        setIsLoading(false);
      }
    }

    void validateAndRestoreSession();
  }, [restaurantId]);

  // Load menu + available table numbers in parallel (independent of session).
  useEffect(() => {
    async function loadInitialData() {
      const [menuData, tablesData] = await Promise.allSettled([
        getPublicMenu(restaurantId),
        getPublicTables(restaurantId),
      ]);

      if (menuData.status === "fulfilled") {
        setMenu(menuData.value);
      } else {
        setError(getPublicApiError(menuData.reason, "We couldn't load this menu."));
      }

      if (tablesData.status === "fulfilled") {
        setTableNumbers(tablesData.value);
        setTablesFailed(false);
      } else {
        setTablesFailed(true);
      }
    }

    void loadInitialData();
  }, [restaurantId]);

  const runTableCheck = useCallback(
    async (nextSession: GuestSession) => {
      setIsCheckingTable(true);
      setError("");
      try {
        const result = await checkTable(restaurantId, nextSession.tableNumber);
        if (result.hasActiveOrder && result.order) {
          setActiveOrder(result.order);
          setStep("active-order");
          return;
        }

        setActiveOrder(null);
        setMode("create");
        cart.clearCart();
        setStep("menu");
      } catch (requestError) {
        setError(getPublicApiError(requestError, "We couldn't check this table."));
      } finally {
        setIsCheckingTable(false);
      }
    },
    [cart, restaurantId],
  );

  /** First-time visitor submits the name + table form. */
  const startSession = (details: { customerName: string; tableNumber: number }) => {
    const nextSession: GuestSession = details;
    setGuestSession(restaurantId, nextSession);
    setSession(nextSession);
    void runTableCheck(nextSession);
  };

  /**
   * Continue session: the session was already validated against the backend on
   * mount (activeOrder is set and known to be PENDING/PREPARING), so go directly
   * to the menu in join mode — no second backend check needed.
   */
  const continueSession = () => {
    if (!session) return;
    if (activeOrder) {
      setMode("join");
      cart.clearCart();
      setStep("menu");
      return;
    }
    // Fallback: re-run the table check (covers the unlikely edge case where
    // activeOrder was cleared after mount but before the user clicked Continue).
    void runTableCheck(session);
  };

  /**
   * Bug 1 fix: start a completely fresh session.
   * 1. Wipe all localStorage session data.
   * 2. Return to the Name + Table Number form.
   * 3. On submit, the full backend active-order check runs as normal.
   *    If another customer's order is still open on that table, they will see
   *    the "Join Existing / Create Separate" prompt — localStorage is not consulted.
   */
  const startNewSession = () => {
    clearGuestSession(restaurantId);
    setSession(null);
    setActiveOrder(null);
    setConfirmedOrder(null);
    cart.clearCart();
    setStep("details");
  };

  /**
   * Bug 2 fix: called by OrderConfirmation when the polled status becomes
   * READY or CANCELLED. Clear localStorage so the next QR scan starts fresh.
   */
  const handleSessionEnd = () => {
    clearGuestSession(restaurantId);
    setSession(null);
  };

  const showMenuForJoin = () => {
    if (!activeOrder) return;
    setMode("join");
    cart.clearCart();
    setStep("menu");
  };

  const showMenuForSeparateOrder = () => {
    setMode("create");
    cart.clearCart();
    setStep("menu");
  };

  const submitCart = async ({
    specialInstructions,
    idempotencyKey,
  }: {
    specialInstructions?: string;
    idempotencyKey: string;
  }) => {
    if (!session) return;
    setCartError("");

    const items = cart.items.map((entry) => ({
      menuItemId: entry.item.id,
      quantity: entry.quantity,
    }));

    try {
      if (mode === "join") {
        const orderToJoin = activeOrder ?? confirmedOrder;
        if (!orderToJoin) return;
        const result = await joinPublicOrder(restaurantId, orderToJoin.id, {
          items,
          idempotencyKey,
        });
        setConfirmedOrder(result.order);
        setActiveOrder(result.order);
        setGuestSession(restaurantId, {
          ...session,
          activeOrderId: result.order.id,
        });
      } else {
        const result = await createPublicOrder(restaurantId, {
          tableNumber: session.tableNumber,
          customerName: session.customerName,
          items,
          specialInstructions,
          idempotencyKey,
        });
        const nextSession = {
          ...session,
          sessionToken: result.sessionToken,
          activeOrderId: result.order.id,
        };
        setSession(nextSession);
        setGuestSession(restaurantId, nextSession);
        setConfirmedOrder(result.order);
        setActiveOrder(result.order);
      }

      cart.clearCart();
      setCartOpen(false);
      setStep("confirmation");
    } catch (requestError) {
      setCartError(
        getPublicApiError(
          requestError,
          "Something changed before we could send this order. Please review your cart.",
        ),
      );
      throw requestError;
    }
  };

  const addMoreToConfirmedOrder = () => {
    if (!confirmedOrder) return;
    setActiveOrder(confirmedOrder);
    setMode("join");
    cart.clearCart();
    setStep("menu");
  };

  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography mt={2} color="text.secondary">
          Warming up the menu...
        </Typography>
      </Container>
    );
  }

  return (
    <Box minHeight="100vh">
      <Container maxWidth="sm" sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          {step === "welcome" && session && (
            <WelcomeBackCard
              customerName={session.customerName}
              tableNumber={session.tableNumber}
              onContinue={continueSession}
              onStartNew={startNewSession}
              isLoading={isCheckingTable}
            />
          )}

          {step === "details" && (
            <DetailsForm
              tableNumbers={tableNumbers}
              tablesFailed={tablesFailed}
              isSubmitting={isCheckingTable}
              onSubmit={startSession}
            />
          )}

          {step === "active-order" && activeOrder && session && (
            <ActiveOrderPrompt
              tableNumber={session.tableNumber}
              order={activeOrder}
              onJoin={showMenuForJoin}
              onCreateSeparate={showMenuForSeparateOrder}
            />
          )}

          {step === "confirmation" && confirmedOrder && (
            <OrderConfirmation
              order={confirmedOrder}
              restaurantId={restaurantId}
              onAddMore={addMoreToConfirmedOrder}
              onSessionEnd={handleSessionEnd}
            />
          )}
        </Stack>
      </Container>

      {step === "menu" && menu && (
        <>
          <Container maxWidth="md" sx={{ pt: 2 }}>
            <Button
              startIcon={<ArrowBackRoundedIcon />}
              color="inherit"
              onClick={() => {
                setCartOpen(false);
                setStep(activeOrder ? "active-order" : "details");
              }}
              sx={{ px: 0 }}
            >
              Back
            </Button>
          </Container>
          <CustomerMenu menu={menu} onOpenCart={() => setCartOpen(true)} />
          <CartDrawer
            open={cartOpen}
            mode={mode}
            error={cartError}
            onClose={() => setCartOpen(false)}
            onSubmit={submitCart}
          />
        </>
      )}
    </Box>
  );
}

export default function OrderEntryPage() {
  const { restaurantId } = useParams();
  if (!restaurantId) return <Navigate to="/login" replace />;

  return (
    <CartProvider>
      <OrderEntryContent restaurantId={restaurantId} />
    </CartProvider>
  );
}
