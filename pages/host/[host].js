import { useRouter } from 'next/router';
import GamePage from '../../components/GamePage';
export default function Host(){ const router=useRouter(); return router.isReady ? <GamePage roomKey={router.query.host}/> : null; }
