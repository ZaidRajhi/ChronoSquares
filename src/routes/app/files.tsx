import { createFileRoute } from "@tanstack/react-router";
import { FilesPage } from "@/components/delivery/DeliveryPages";

export const Route = createFileRoute("/app/files")({ component: FilesPage });