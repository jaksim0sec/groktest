import { createFileRoute } from "@tanstack/react-router";
import { NeulbamApp } from "@/components/NeulbamApp";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-sans-kr/500.css";
import "@fontsource/noto-sans-kr/700.css";

export const Route = createFileRoute("/")({ component: NeulbamApp });
