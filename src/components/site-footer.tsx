import { Link } from "@tanstack/react-router";

const PHONE = "(361) 945-5867";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-deep text-foam">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl">Skydive South Texas</p>
          <p className="mt-2 text-sm text-sand leading-relaxed">
            Mustang Beach Airport, Hangar #1
            <br />
            139 Piper Blvd
            <br />
            Port Aransas, TX 78373
          </p>
          <p className="mt-3 text-sm text-sand">Fri–Sun 10am–8pm. Mon–Thu by appointment.</p>
          <a className="mt-3 inline-block text-foam underline" href="tel:+13619455867">
            {PHONE}
          </a>
        </div>
        <div className="text-sm">
          <p className="text-xs font-semibold tracking-[0.16em] text-sand uppercase">Jump</p>
          <ul className="mt-3 space-y-2">
            <li><Link to="/book">Book a jump</Link></li>
            <li><Link to="/groups">Group events</Link></li>
            <li><Link to="/gift-cards">Gift cards</Link></li>
            <li><Link to="/scenic-flights">Scenic flights</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-xs font-semibold tracking-[0.16em] text-sand uppercase">Before you come</p>
          <ul className="mt-3 space-y-2">
            <li><Link to="/jumper-info">Jumper info</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/photos">Photos</Link></li>
            <li><Link to="/testimonials">Reviews</Link></li>
            <li><Link to="/merch">Merch</Link></li>
            <li><Link to="/guides">Guides</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-xs font-semibold tracking-[0.16em] text-sand uppercase">The dropzone</p>
          <ul className="mt-3 space-y-2">
            <li><Link to="/desk">Staff manifest and load clock</Link></li>
            <li>
              <a href="https://www.tripadvisor.com/Attraction_Review-g56476-d4471283-Reviews-Skydive_South_Texas_Mustang_Island_Skydiving-Port_Aransas_Texas.html">
                Tripadvisor
              </a>
            </li>
            <li>
              <a href="sms:+13619455867">Text the hangar</a>
            </li>
          </ul>
          <p className="mt-4 text-sand">Since 2010. USPA-certified instructors.</p>
        </div>
      </div>
    </footer>
  );
}

export function PageIntro({ kicker, title, lede }: { kicker: string; title: string; lede: string }) {
  return (
    <header className="mx-auto max-w-3xl px-5 pt-8">
      <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">{kicker}</p>
      <h1 className="mt-2 text-5xl">{title}</h1>
      <p className="mt-4 text-lg text-muted leading-relaxed">{lede}</p>
    </header>
  );
}
