import type { Route } from "./+types/_index";
import LandingRoute from "@/features/landing/routes/index";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "home" },
		{ name: "description", content: "home is a web application" },
	];
}

export default function Home() {
	return (
		<LandingRoute />
	);
}
