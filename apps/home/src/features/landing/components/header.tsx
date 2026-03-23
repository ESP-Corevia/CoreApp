import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="border-gray-200 border-b bg-white text-black shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="font-semibold text-xl underline decoration-[#008000] transition-colors hover:text-gray-600"
        >
          Corevia
        </Link>

        <Link to={`${import.meta.env.VITE_BACKOFFICE_DOMAIN}/login`} target="_blank">
          <Button className="cursor-pointer border-2 border-[#008000] border-solid bg-white transition-colors hover:text-gray-600">
            Login to back-office
          </Button>
        </Link>
      </div>
    </header>
  );
}
