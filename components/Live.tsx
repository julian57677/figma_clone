import { useEventListener, useMyPresence, useOthers } from "@/liveblocks.config"
import LiveCursors from "./cursor/LiveCursors"
import { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import { Timestamp } from "@liveblocks/react-comments/primitives";
import { Props } from "next/script";
import { Comments } from "./comments/Comments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { shortcuts } from "@/constants";
import { Item } from "@radix-ui/react-dropdown-menu";


type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
}

const Live = ({ canvasRef, undo, redo}: Props) => {
  const others = useOthers();
  const [{cursor}, updateMyPresence] = useMyPresence();

  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  })

  const [reaction, setReactions] = useState<Reaction[]>([]);
  

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

  useEventListener((eventData) => {
    const event = eventData.event
    setReactions((reactions) =>
      reactions.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

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

  const setReaction = useCallback((reaction: string) => {
    setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
  }, []);

  const handleContextMenuClick = useCallback((key: string) => {
    switch(key){
      case "chat":
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
        break;
      
      case "Reactions":
        setCursorState({mode: CursorMode.ReactionSelector});
        break;

      case "Undo":
        undo();
        break;

      default:
        break;
    }
  }, [])

  return (
    <ContextMenu>
    <ContextMenuTrigger
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

      <LiveCursors />
     
    </ContextMenuTrigger>

    <ContextMenuContent className="right-menu-content">
      {shortcuts.map((item) => (
        <ContextMenuItem key={item.key} onClick={() => handleContextMenuClick(item.name)} className="right-menu-item">
      
        <p>{item.name}</p>
        <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
        </ContextMenuItem>
      ))}

    </ContextMenuContent>

    </ContextMenu>
  )
}

export default Live

