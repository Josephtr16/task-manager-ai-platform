import React, { createContext, useContext, useMemo, useState } from 'react';

const FocusContext = createContext({
  isFocusMode: false,
  setFocusMode: () => {},
});

export const FocusProvider = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const value = useMemo(() => ({
    isFocusMode,
    setFocusMode: setIsFocusMode,
  }), [isFocusMode]);

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
};

export const useFocus = () => useContext(FocusContext);

export default FocusContext;
