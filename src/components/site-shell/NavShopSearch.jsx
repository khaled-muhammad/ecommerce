import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";

export default function NavShopSearch({ navRef }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const inputRef = useRef(null);

  const isShopList = location.pathname === "/shop";
  const qFromShop = params.get("q") ?? "";

  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");

  const displayValue = isShopList ? qFromShop : draft;

  useEffect(() => {
    if (!isShopList) {
      setDraft("");
    }
  }, [isShopList, location.pathname]);

  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!expanded) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    const onKey = (e) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  const pushShopQuery = (qRaw) => {
    const q = qRaw.trim();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  const submitFromAnywhere = (qRaw) => {
    const q = qRaw.trim();
    if (isShopList) {
      pushShopQuery(q);
    } else {
      const next = new URLSearchParams();
      if (q) next.set("q", q);
      const qs = next.toString();
      navigate(qs ? `/shop?${qs}` : "/shop");
    }
    setExpanded(false);
  };

  const navEl = navRef?.current;
  const overlay =
    expanded && navEl
      ? createPortal(
          <div className="site-nav-search-expand" role="search">
            <button
              type="button"
              className="site-nav-search-expand__close"
              onClick={() => setExpanded(false)}
              aria-label="Close search"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <form
              className="site-nav-search-expand__form"
              onSubmit={(e) => {
                e.preventDefault();
                submitFromAnywhere(displayValue);
              }}
            >
              <div className="site-nav-search-expand__box">
                <Search className="site-nav-search-expand__icon" aria-hidden strokeWidth={2} />
                <input
                  ref={inputRef}
                  type="search"
                  name="q"
                  value={displayValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (isShopList) {
                      const next = new URLSearchParams(params);
                      if (v.trim()) next.set("q", v);
                      else next.delete("q");
                      setParams(next, { replace: true });
                    } else {
                      setDraft(v);
                    }
                  }}
                  placeholder="Search products, brands…"
                  className="site-nav-search-expand__input"
                  autoComplete="off"
                  enterKeyHint="search"
                  aria-label="Search products"
                />
              </div>
            </form>
          </div>,
          navEl,
        )
      : null;

  return (
    <>
      {!expanded ? (
        <button
          type="button"
          className="site-nav-search-trigger"
          onClick={() => setExpanded(true)}
          aria-label="Open search"
          aria-expanded={false}
          aria-haspopup="dialog"
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          {(isShopList && qFromShop) || (!isShopList && draft) ? (
            <span className="site-nav-search-trigger__dot" aria-hidden />
          ) : null}
        </button>
      ) : null}
      {overlay}
    </>
  );
}
