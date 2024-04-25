import { useMyPresence, useOthers } from "@/liveblocks.config"
import LiveCursors from "./cursor/LiveCursors"
import { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import { Timestamp } from "@liveblocks/react-comments/primitives";
import { Props } from "next/script";

type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const Live = ({ canvasRef }: Props) => {
  const others = useOthers();
  const [{cursor}, updateMyPresence] = useMyPresence()as any;

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  })

  const [reaction, setReaction] = useState<Reaction[]>([]);

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    event.preventDefault();

    if(cursor == null || cursorState.mode !== CursorMode.ReactionSelector){

      const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
      const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

      updateMyPresence({cursor: {x,y}});    
    }
  }, [])

  const handlePointerLeave = useCallback((event: React.PointerEvent) => {
    setCursorState({ mode: CursorMode.Hidden})
    
    updateMyPresence({cursor: null, message: null});
  }, [])

  const handlePointerDown = useCallback((event: React.PointerEvent) => {
    const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
    const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

    updateMyPresence({cursor: {x,y}});

    setCursorState((state: CursorState) => 
        cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state
    );
  }, [])

  const handlePointerUp = useCallback(() => {
    setCursorState((state: CursorState) =>
      cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: false } : state
    );
  }, [cursorState.mode, setCursorState]);

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === '/'){
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null, 
          message: '',
        }) 
      } else if(e.key === 'Escape'){
        updateMyPresence({message: ''})
        setCursorState({ mode: CursorMode.Hidden})
      } else if(e.key === 'e'){
        setCursorState({mode: CursorMode.ReactionSelector,})
      }
    }

    const oneKeyDown = (e: KeyboardEvent) => {
      if(e.key === '/') {
        e.preventDefault();
      }
    }
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', oneKeyDown);

    return () => {
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', oneKeyDown);
    }
  }, [updateMyPresence]);

  return (
    <div
      id="canvas"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="h-[100vh] w-full flex justify-center items-center text-center"
      
    >
      <canvas ref={canvasRef}/>
      
      {reaction.map((r) => (
          <FlyingReaction
            key={r.timestamp.toString()}
            x={r.point.x}
            y={r.point.y}
            timestamp={r.timestamp}
            value={r.value}
          />
        ))}

        {cursor &&(
        <CursorChat
           cursor={cursor}
           cursorState={cursorState}
           setCursorState={setCursorState}
           updateMyPresence={updateMyPresence}
        />
      )}



      {cursorState.mode === CursorMode.ReactionSelector && (
        <ReactionSelector
          setReaction={(reaction) => {
            setCursorState({mode: CursorMode.Reaction,reaction, isPressed: false})
          }}
        />
      )}

      <LiveCursors others={others} />
    </div>
  )
}

export default Live

