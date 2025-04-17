// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Stores data in AsyncStorage.
 * @param {string} key The key to store data under.
 * @param {any} value The value to store (will be stringified).
 */
export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    // console.log(`Data stored successfully for key: ${key}`);
  } catch (e) {
    console.error(`Error storing data for key ${key}:`, e);
    // Optionally: alert the user or log to a service
  }
};

/**
 * Retrieves data from AsyncStorage.
 * @param {string} key The key to retrieve data from.
 * @returns {Promise<any|null>} The parsed data, or null if not found or error.
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    // console.log(`Data retrieved for key ${key}:`, jsonValue);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error(`Error retrieving data for key ${key}:`, e);
    return null; // Return null on error
  }
};

/**
 * Removes data from AsyncStorage.
 * @param {string} key The key to remove.
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    // console.log(`Data removed successfully for key: ${key}`);
  } catch (e) {
    console.error(`Error removing data for key ${key}:`, e);
  }
};