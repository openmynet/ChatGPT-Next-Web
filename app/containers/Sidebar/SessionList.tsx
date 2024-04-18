import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from "@hello-pangea/dnd";

import { useAppConfig, useChatStore } from "@/app/store";

import Locale from "@/app/locales";
import { useLocation, useNavigate } from "react-router-dom";
import { Path } from "@/app/constant";
import { Mask } from "@/app/store/mask";
import { useRef, useEffect, useMemo } from "react";
import { showConfirm } from "@/app/components/ui-lib";

import AddIcon from "@/app/icons/addIcon.svg";
import NextChatTitle from "@/app/icons/nextchatTitle.svg";
import { ListHoodProps } from "./types";
import useMobileScreen from "@/app/hooks/useMobileScreen";
import { getTime } from "@/app/utils";
import DeleteIcon from "@/app/icons/deleteIcon.svg";
import LogIcon from "@/app/icons/logIcon.svg";

export function SessionItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const { pathname: currentPath } = useLocation();

  return (
    <Draggable draggableId={`${props.id}`} index={props.index}>
      {(provided) => (
        <div
          className={`group relative flex p-3 items-center gap-2 self-stretch rounded-md hover:bg-gray-200 mb-2 ${
            props.selected &&
            (currentPath === Path.Chat || currentPath === Path.Home)
              ? `bg-blue-100 border-blue-200 border`
              : `bg-gray-100`
          }`}
          onClick={props.onClick}
          ref={(ele) => {
            draggableRef.current = ele;
            provided.innerRef(ele);
          }}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          title={`${props.title}\n${Locale.ChatItem.ChatItemCount(
            props.count,
          )}`}
        >
          <div className=" flex-shrink-0">
            <LogIcon />
          </div>
          <div className="flex flex-col flex-1">
            <div className={`flex justify-between items-center`}>
              <div
                className={` text-gray-900 text-sm-title line-clamp-1 flex-1`}
              >
                {props.title}
              </div>
              <div
                className={`text-gray-500 text-sm group-hover:opacity-0 pl-3`}
              >
                {getTime(props.time)}
              </div>
            </div>
            <div className={`text-gray-500 text-sm`}>
              {Locale.ChatItem.ChatItemCount(props.count)}
            </div>
          </div>

          <div
            className={`absolute top-[50%] translate-y-[-50%] right-3 pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100`}
            onClickCapture={(e) => {
              props.onDelete?.();
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <DeleteIcon />
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function SessionList(props: ListHoodProps) {
  const [sessions, selectedIndex, selectSession, moveSession] = useChatStore(
    (state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.moveSession,
    ],
  );
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();

  const config = useAppConfig();

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;
    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveSession(source.index, destination.index);
  };

  let layoutClassName = "py-7 px-0";

  if (isMobileScreen) {
    layoutClassName = "h-menu-title-mobile py-6";
  }

  return (
    <>
      <div data-tauri-drag-region>
        <div
          className={`flex items-center justify-between ${layoutClassName}`}
          data-tauri-drag-region
        >
          <div className="">
            <NextChatTitle />
          </div>
          <div
            className=""
            onClick={() => {
              if (config.dontShowMaskSplashScreen) {
                chatStore.newSession();
                navigate(Path.Chat);
              } else {
                navigate(Path.NewChat);
              }
            }}
          >
            <AddIcon />
          </div>
        </div>
        <div className={`pb-3 text-sm sm:text-sm-mobile text-blue-500`}>
          Build your own AI assistant.
        </div>
      </div>

      <div
        className={`flex overflow-y-auto overflow-x-hidden`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chat-list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="w-[100%]"
              >
                {sessions.map((item, i) => (
                  <SessionItem
                    title={item.topic}
                    time={new Date(item.lastUpdate).toLocaleString()}
                    count={item.messages.length}
                    key={item.id}
                    id={item.id}
                    index={i}
                    selected={i === selectedIndex}
                    onClick={() => {
                      navigate(Path.Chat);
                      selectSession(i);
                    }}
                    onDelete={async () => {
                      if (
                        !isMobileScreen ||
                        (await showConfirm(Locale.Home.DeleteChat))
                      ) {
                        chatStore.deleteSession(i);
                      }
                    }}
                    mask={item.mask}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </>
  );
}