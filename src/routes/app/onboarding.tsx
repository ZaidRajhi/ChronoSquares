import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/components/delivery/DeliveryPages";

export const Route = createFileRoute("/app/onboarding")({ component: OnboardingPage });