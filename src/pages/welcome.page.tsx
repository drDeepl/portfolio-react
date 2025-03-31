import { motion } from 'framer-motion';
import GlassmorphismCard from '../components/glass-card.component';
import LoadingCounter from '../components/loading-counter.component';

const WelcomePage = () => {
  return (
    <div className="">
      <LoadingCounter />
      <GlassmorphismCard className="text-slate-800" />
    </div>
  );
};

export default WelcomePage;
