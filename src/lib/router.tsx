import React, { createContext, useContext, useEffect, useState, type ReactNode, type MouseEvent } from "react";

interface RouterContextType {
  pathname: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: "/",
  navigate: () => {},
});

function getPathFromHash(): string {
  if (typeof window === "undefined") return "/";
  const hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#/") return "/";
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  return clean.startsWith("/") ? clean : "/" + clean;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [pathname, setPathname] = useState<string>(getPathFromHash);

  useEffect(() => {
    const handleHashChange = () => {
      setPathname(getPathFromHash());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = (to: string) => {
    const target = to.startsWith("/") ? to : "/" + to;
    if (window.location.hash !== "#" + target) {
      window.location.hash = target;
    } else {
      setPathname(target);
    }
  };

  return (
    <RouterContext.Provider value={{ pathname, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function usePathname(): string {
  return useContext(RouterContext).pathname;
}

export function useRouter() {
  const { navigate } = useContext(RouterContext);
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to),
    back: () => window.history.back(),
  };
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
}

export function Link({ href, children, onClick, ...props }: LinkProps) {
  const { navigate } = useContext(RouterContext);
  const hashHref = href.startsWith("#") ? href : "#" + (href.startsWith("/") ? href : "/" + href);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      navigate(href);
    }
  };

  return (
    <a href={hashHref} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

export function Image({
  src,
  alt = "",
  width,
  height,
  className,
  priority,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      {...props}
    />
  );
}

export function notFound() {
  return null;
}

export { Link as default };
