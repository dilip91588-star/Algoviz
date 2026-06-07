import { ReactNode } from "react";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 ALGOVIZ. Virtual Algorithm Visualization Laboratory.
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Visualize. Understand. Master.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
