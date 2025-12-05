import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white text-black border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-xl font-semibold hover:text-gray-600 transition-colors decoration-[#008000] underline"
        >
          Corevia
        </Link>

        <Link to={import.meta.env.VITE_BACKOFFICE_DOMAIN + "/login"} target='about:_blank'>
          <Button
            className="border-[#008000] cursor-pointer border-2 border-solid bg-white hover:text-gray-600 transition-colors"
          >
            Login to back-office
          </Button>
        </Link>
      </div>
    </header>
  );
}