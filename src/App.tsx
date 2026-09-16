import { About } from "./components/About";
import { Clients } from "./components/Clients";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Intelligence } from "./components/Intelligence";
import { Method } from "./components/Method";
import { Positioning } from "./components/Positioning";
import { Services } from "./components/Services";
import { Work } from "./components/Work";

export function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        انتقل إلى المحتوى
      </a>

      <Header />

      <main id="main">
        <Hero />
        <Clients />
        <Positioning />
        <Services />
        <Method />
        <Work />
        <Intelligence />
        <About />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
