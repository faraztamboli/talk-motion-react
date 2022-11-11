import { useEffect, useState } from 'react';

function getSavedValue(key, initialValue) {
  const savedValue = localStorage.getItem(key);
  if (savedValue) return savedValue;

  // checking if initial value is function
  if (initialValue instanceof Function) return initialValue();

  return initialValue;
}

/**
 * Works same as useState, also save values in Local Storage
 *
 * @param {key} key to identify value in Local Storage
 * @param {number} initialValue same as we pass to useState
 * @return {value, setValue()} same value with an update function
 */
export default function useLocalStorage(key, initialValue) {
  // using function version of initial value to only load the value on first render
  const [value, setValue] = useState(() => {
    return getSavedValue(key, initialValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
}
