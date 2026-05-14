/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [taskHudVisible, setTaskHudVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('执行论坛互动');
  const [taskStatusText, setTaskStatusText] = useState('');
  const [taskRunning, setTaskRunning] = useState(false);
  const [taskFailed, setTaskFailed] = useState(false);
  const [taskContext, setTaskContext] = useState(null);
  const [taskStepStates, setTaskStepStates] = useState([]);

  const value = useMemo(() => ({
    taskHudVisible,
    setTaskHudVisible,
    taskTitle,
    setTaskTitle,
    taskStatusText,
    setTaskStatusText,
    taskRunning,
    setTaskRunning,
    taskFailed,
    setTaskFailed,
    taskContext,
    setTaskContext,
    taskStepStates,
    setTaskStepStates,
  }), [
    taskHudVisible,
    taskTitle,
    taskStatusText,
    taskRunning,
    taskFailed,
    taskContext,
    taskStepStates,
  ]);

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTask() {
  const ctx = useContext(TaskContext);
  if (!ctx) {
    throw new Error('useTask must be used within TaskProvider');
  }
  return ctx;
}
