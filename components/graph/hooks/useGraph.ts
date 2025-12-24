import { useReducer } from "react";
import type { GraphControlState, GraphInteractionState } from "@/lib/types/graph";

export interface GraphState {
  controls: GraphControlState;
  interaction: GraphInteractionState;
  graphReady: boolean;
}

export const initialGraphState: GraphState = {
  controls: {
    metric: "volume",
    scale: "log",
    minEdgeWeight: 0,
    maxNodes: 1000,
    hideIsolated: true,
    layoutRunning: false,
  },
  interaction: {
    selectedNode: null,
    hoveredNode: null,
    searchQuery: "",
    focusedCommunity: null,
  },
  graphReady: false,
};

type GraphAction =
  | { type: "UPDATE_CONTROLS"; payload: Partial<GraphControlState> }
  | { type: "SET_HOVERED_NODE"; payload: string | null }
  | { type: "SET_SELECTED_NODE"; payload: string | null }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FOCUSED_COMMUNITY"; payload: number | null }
  | { type: "SET_LAYOUT_RUNNING"; payload: boolean }
  | { type: "SET_GRAPH_READY"; payload: boolean }
  | { type: "RESET_INTERACTION" };

export function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case "UPDATE_CONTROLS":
      return {
        ...state,
        controls: { ...state.controls, ...action.payload },
      };
    case "SET_HOVERED_NODE":
      return {
        ...state,
        interaction: { ...state.interaction, hoveredNode: action.payload },
      };
    case "SET_SELECTED_NODE":
      return {
        ...state,
        interaction: { ...state.interaction, selectedNode: action.payload },
      };
    case "SET_SEARCH_QUERY":
      return {
        ...state,
        interaction: { ...state.interaction, searchQuery: action.payload },
      };
    case "SET_FOCUSED_COMMUNITY":
      return {
        ...state,
        interaction: { ...state.interaction, focusedCommunity: action.payload },
      };
    case "SET_LAYOUT_RUNNING":
      return {
        ...state,
        controls: { ...state.controls, layoutRunning: action.payload },
      };
    case "SET_GRAPH_READY":
      return { ...state, graphReady: action.payload };
    case "RESET_INTERACTION":
      return {
        ...state,
        interaction: {
          selectedNode: null,
          hoveredNode: null,
          searchQuery: "",
          focusedCommunity: null,
        },
      };
    default:
      return state;
  }
}

export function useGraphState() {
  return useReducer(graphReducer, initialGraphState);
}
