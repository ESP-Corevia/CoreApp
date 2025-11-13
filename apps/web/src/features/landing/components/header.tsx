import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Header({
  alreadyLogin,
}: {
  alreadyLogin?: boolean;
}) {
  return (
    <header className="bg-white text-black border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-xl font-semibold hover:text-gray-600 transition-colors decoration-[#008000] underline"
        >
          Corevia
        </Link>

        <Link to={alreadyLogin ? "/home" : "/login"}>
          <Button
            className="border-[#008000] cursor-pointer border-2 border-solid bg-white hover:text-gray-600 transition-colors"
          >
            {alreadyLogin ? "Home" : "Login"}
          </Button>
        </Link>
      </div>
    </header>
  );
}
