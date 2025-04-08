import { motion } from 'framer-motion';
import GlassmorphismCard from '../components/glass-card.component';
import LoadingCounter from '../components/loading-counter.component';
import GlassScene from '../components/glass.component';

const WelcomePage = () => {
  return (
    <div className="h-screen w-screen">
      {/* <LoadingCounter /> */}
      {/* <GlassmorphismCard className="text-slate-800" /> */}
      <GlassScene />
    </div>
  );
};

export default WelcomePage;
