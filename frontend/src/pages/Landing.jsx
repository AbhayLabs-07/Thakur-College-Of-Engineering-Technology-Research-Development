import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldAlert, Users, Award, BookOpen, Layers } from 'lucide-react';
import Header from '../components/Header';

const Landing = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (localStorage.getItem('role') === 'student') {
      localStorage.clear();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-tcet-lightBg">
      <Header />

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-tcet-navy to-slate-900 text-white py-12 px-4 border-b-4 border-tcet-gold text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e0a96d_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-tcet-gold text-xs font-bold tracking-widest uppercase border border-tcet-gold px-3 py-1 mb-4 inline-block">
            Official Institution Portal
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            SMART INVENTORY MANAGEMENT SYSTEM
          </h2>
          <p className="text-sm md:text-lg text-slate-300 font-medium max-w-2xl mx-auto">
            Facilitating research project resources, checking out hardware kits, and routing faculty-mentor approvals for the TCET Center of Excellence.
          </p>
        </div>
      </section>

      {/* Main Portals Selection Grid */}
      <main className="max-w-6xl mx-auto px-4 py-12 flex-grow w-full">
        <h3 className="text-center text-tcet-navy font-bold text-xs uppercase tracking-widest mb-8">
          Select Your Portal Access Point
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Student Login Portal */}
          <div className="bg-white border-t-4 border-2 border-slate-300 border-t-tcet-navy hover:border-tcet-navy p-8 flex flex-col justify-between items-center text-center hover:shadow-lg transition-all group">
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-tcet-navy group-hover:text-white transition-colors">
              <Users className="w-8 h-8 text-tcet-navy group-hover:text-white transition-colors" />
            </div>
            <h4 className="font-extrabold text-lg text-tcet-navy mb-2">STUDENT PORTAL</h4>
            <p className="text-xs text-tcet-mutedText mb-6 max-w-xs">
              Log in with your deterministically generated ERP account credentials to browse laboratory inventory, cart components, and submit checkout requests.
            </p>
            <button
              onClick={() => navigate('/student-login')}
              className="w-full bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider"
            >
              ACCESS PORTAL
            </button>
          </div>

          {/* Faculty Mentor Portal */}
          <div className="bg-white border-t-4 border-2 border-slate-300 border-t-tcet-gold hover:border-tcet-gold p-8 flex flex-col justify-between items-center text-center hover:shadow-lg transition-all group">
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-tcet-gold group-hover:text-tcet-navy transition-colors">
              <Award className="w-8 h-8 text-tcet-navy group-hover:text-tcet-navy transition-colors" />
            </div>
            <h4 className="font-extrabold text-lg text-tcet-navy mb-2">FACULTY MENTOR</h4>
            <p className="text-xs text-tcet-mutedText mb-6 max-w-xs">
              For assigned faculty advisors to review student project domains, examine required hardware requests, and approve/reject before admin dispatch.
            </p>
            <button
              onClick={() => navigate('/faculty-login')}
              className="w-full bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider"
            >
              ACCESS PORTAL
            </button>
          </div>

          {/* Lab Administrator Portal */}
          <div className="bg-white border-t-4 border-2 border-slate-300 border-t-slate-800 hover:border-slate-800 p-8 flex flex-col justify-between items-center text-center hover:shadow-lg transition-all group">
            <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 mb-6 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <ShieldAlert className="w-8 h-8 text-tcet-navy group-hover:text-white transition-colors" />
            </div>
            <h4 className="font-extrabold text-lg text-tcet-navy mb-2">ADMIN PANEL</h4>
            <p className="text-xs text-tcet-mutedText mb-6 max-w-xs">
              System access point for laboratory managers to track checkout fulfillment state, monitor overdue inventory assets, and adjust component stock levels.
            </p>
            <button
              onClick={() => navigate('/admin-login')}
              className="w-full bg-tcet-navy hover:bg-slate-800 text-white font-bold text-xs py-3 border border-tcet-navy uppercase transition-all tracking-wider"
            >
              ACCESS PORTAL
            </button>
          </div>
        </div>

        {/* Section Divider */}
        <div className="border-t-2 border-slate-300 my-12 relative flex justify-center">
          <span className="bg-tcet-lightBg px-6 text-xs font-bold text-tcet-navy absolute -top-2 px-4 uppercase tracking-widest">
            About the R&D Cell & COE
          </span>
        </div>

        {/* About Section featuring Dr. Vinitkumar Dongre */}
        <div className="bg-white border-2 border-slate-300 p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 shadow-sm">
          {/* Dr. Vinitkumar Dongre Image & Details */}
          <div className="text-center lg:border-r border-slate-200 lg:pr-8 flex flex-col items-center justify-center">
            <div className="border-2 border-tcet-navy p-1 bg-white mb-4">
              <img 
                src="/vini_dongre.jpg" 
                alt="Dr. Vinitkumar Dongre" 
                className="w-44 h-48 object-cover filter contrast-105"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80'; // fallback
                }}
              />
            </div>
            <h4 className="font-bold text-lg text-tcet-navy">Dr. Vinitkumar Dongre</h4>
            <p className="text-xs text-tcet-gold font-extrabold uppercase tracking-wide">Professor & Dean R&D</p>
            <p className="text-[10px] text-tcet-mutedText mt-1">Thakur College of Engineering & Technology</p>
          </div>

          {/* About Text */}
          <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
            <h4 className="font-extrabold text-xl text-tcet-navy border-b-2 border-tcet-gold pb-2 uppercase tracking-wide">
              Center of Excellence (CoE) Laboratory Infrastructure
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              The Research and Development (R&D) Cell at Thakur College of Engineering and Technology (TCET), under the expert guidance and leadership of <strong>Dr. Vinitkumar Dongre</strong>, is committed to fostering academic research, innovation, and technological advancements.
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              The Center of Excellence (CoE) laboratory facility serves as a state-of-the-art incubation hub where students and faculty mentors collaborate on engineering prototypes and core research publications. This smart inventory portal allows the cell to maintain accountability, manage and distribute hardware components (such as IoT microcontrollers, telemetry systems, high-precision sensors, and actuators) seamlessly.
            </p>
            
            {/* Features Row */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center">
              <div className="flex flex-col items-center">
                <BookOpen className="w-5 h-5 text-tcet-gold mb-1" />
                <span className="text-[10px] font-bold uppercase text-tcet-navy">Frictionless Auditing</span>
              </div>
              <div className="flex flex-col items-center">
                <Layers className="w-5 h-5 text-tcet-gold mb-1" />
                <span className="text-[10px] font-bold uppercase text-tcet-navy">Strict Approvals</span>
              </div>
              <div className="flex flex-col items-center">
                <Award className="w-5 h-5 text-tcet-gold mb-1" />
                <span className="text-[10px] font-bold uppercase text-tcet-navy">Project Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-tcet-navy text-slate-300 py-6 px-4 text-center text-xs border-t-2 border-tcet-gold">
        <p className="font-semibold">© {new Date().getFullYear()} Thakur College of Engineering & Technology (TCET). All Rights Reserved.</p>
        <p className="text-[10px] text-slate-500 mt-1">Developed for TCET Research & Development Cell • Incubation & CoE Facilities</p>
      </footer>
    </div>
  );
};

export default Landing;
