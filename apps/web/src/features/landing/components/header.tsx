import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Header({
  alreadyLogin
}: {
  alreadyLogin?: boolean
}) {
  return (
    <header className="bg-black text-green-400">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo / Nom */}
        <Link
          to="/"
          className="text-xl font-semibold hover:text-green-300 transition-colors"
        >
          Corevia
        </Link>

        {/* Bouton Login */}
        <Link to={alreadyLogin ? "/home" : "/login"}>
          <Button
            variant="outline"
            className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white transition-colors"
          >
            {alreadyLogin ? "Home" : "Login"}
          </Button>
        </Link>
      </div>
    </header>
  );
}
