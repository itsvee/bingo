import { useRouter } from 'next/router';
import GamePage from '../components/GamePage';
export default function Room(){ const router=useRouter(); return router.isReady ? <GamePage roomKey={router.query.room}/> : null; }
