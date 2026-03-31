import { Link } from "react-router-dom";
import FooterSocialLinks from "../components/FooterSocialLinks.jsx";
import "./site-footer.css";

export default function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo" aria-label="Site">
      <div className="site-footer__panel">
        <div className="site-footer__inner">
          <div className="site-footer__grid">
            <div>
              <Link className="site-footer__brand" to="/">
                Roxy
              </Link>
              <p className="site-footer__tagline">
                Genuine parts, clear specs, and builds without compromise, matched to your light or dark workspace.
              </p>
            </div>

            <nav aria-label="Shop">
              <h2 className="site-footer__col-title">Shop</h2>
              <ul className="site-footer__links">
                <li>
                  <Link to="/shop">Shop</Link>
                </li>
                <li>
                  <Link to="/categories">Categories</Link>
                </li>
                <li>
                  <Link to="/brands">Brands</Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Account">
              <h2 className="site-footer__col-title">Account</h2>
              <ul className="site-footer__links">
                <li>
                  <Link to="/sign-in">Sign in</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
                <li>
                  <Link to="/cart">Cart</Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Legal">
              <h2 className="site-footer__col-title">Legal</h2>
              <ul className="site-footer__links">
                <li>
                  <Link to="/privacy">Privacy</Link>
                </li>
                <li>
                  <Link to="/terms">Terms</Link>
                </li>
              </ul>
            </nav>

            <nav aria-label="Help">
              <h2 className="site-footer__col-title">Help</h2>
              <ul className="site-footer__links">
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                <li>
                  <Link to="/support">Support</Link>
                </li>
              </ul>
            </nav>
          </div>

          <FooterSocialLinks className="site-footer__social-wrap" />

          <div className="site-footer__bottom">
            <p className="site-footer__legal">© {new Date().getFullYear()} Roxy. Demo storefront.</p>
            <p className="site-footer__legal">
              <Link to="/contact">Contact</Link>
              <Link to="/support">Support</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
