import { ArrowUpRight, Users, Camera, BriefcaseBusiness, Code, Mail } from "lucide-react";
import "./AppFooter.css";

const groups = [
  { title: "Explore", links: [{ label: "Home", page: "Dashboard" }, { label: "Explore Skills", page: "Explore Skills" }, { label: "Browse Categories", page: "Explore Skills" }, { label: "How It Works", page: "Dashboard" }, { label: "Community", page: "Discover Students" }] },
  { title: "Support", links: [{ label: "Help Center", mail: "Help Center" }, { label: "FAQs", mail: "FAQs" }, { label: "Contact Us", mail: "Contact Us" }, { label: "Report a Problem", mail: "Report a Problem" }] },
  { title: "Legal", links: [{ label: "Privacy Policy", mail: "Privacy Policy" }, { label: "Terms and Conditions", mail: "Terms and Conditions" }, { label: "Cookie Policy", mail: "Cookie Policy" }] },
];

export default function AppFooter({ onNavigate }) {
  const emailLink = (topic) => "mailto:devnextteam@gmail.com?subject=" + encodeURIComponent("SkillSwap Campus - " + topic);
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <section className="site-footer-brand">
          <div className="site-footer-logo"><img src="/icons/icon-192.png" alt="" /><strong>SkillSwap Campus</strong></div>
          <p className="site-footer-tagline">Learn. Share. Grow.</p>
          <p className="site-footer-description">A student-powered community to exchange skills, share knowledge, and grow together.</p>
          <a className="site-footer-email" href={emailLink("General Support")}><Mail size={16}/> devnextteam@gmail.com</a>
        </section>
        {groups.map((group) => <nav className="site-footer-links" aria-label={group.title} key={group.title}>
          <h3>{group.title}</h3>
          {group.links.map((link) => link.page
            ? <button key={link.label} onClick={() => onNavigate(link.page)}>{link.label}<ArrowUpRight size={13}/></button>
            : <a key={link.label} href={emailLink(link.mail)}>{link.label}<ArrowUpRight size={13}/></a>)}
        </nav>)}
        <section className="site-footer-social"><h3>Connect</h3><p>Follow the tools and ideas behind our campus community.</p><div>
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><Users/></a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><Camera/></a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><BriefcaseBusiness/></a>
          <a href="https://github.com/DevNextTeam/SkillSwapCampus" target="_blank" rel="noreferrer" aria-label="GitHub"><Code/></a>
        </div></section>
      </div>
      <div className="site-footer-bottom"><span>© 2026 SkillSwap Campus. All rights reserved.</span><div><a href={emailLink("Privacy Policy")}>Privacy Policy</a><a href={emailLink("Terms of Service")}>Terms of Service</a></div></div>
    </footer>
  );
}