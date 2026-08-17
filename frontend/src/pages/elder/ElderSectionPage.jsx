import { Link } from "react-router-dom";
import { FaArrowLeft, FaCalendarDays, FaCapsules, FaRobot, FaUser } from "react-icons/fa6";
const details = { medicines: [FaCapsules, "Medicines", "Your scheduled medicines will appear here as soon as your family care plan is connected."], appointments: [FaCalendarDays, "Appointments", "Your upcoming appointments will appear here as soon as they are scheduled."], "ai-companion": [FaRobot, "AI Companion", "Your calm, private conversation space is being prepared."], profile: [FaUser, "My Profile", "Your CareConnect profile and preferences will appear here."] };
function ElderSectionPage({ section }) { const [Icon, title, description] = details[section]; return <main className="elder-section-page"><Link to="/elder/dashboard"><FaArrowLeft /> Back to dashboard</Link><section><Icon /><p className="section-eyebrow">CareConnect</p><h1>{title}</h1><p>{description}</p></section></main>; }
export default ElderSectionPage;
