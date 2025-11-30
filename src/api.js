// src/api.js
import axios from 'axios';

export const API_CONFIG = {
  PROD: 'https://polanyze-dev.azurewebsites.net/api',
  LOCAL: 'http://localhost:7071/api'
};

// Default to PROD, but we will allow the UI to change this
let currentBaseUrl = API_CONFIG.PROD;

export const setApiEnv = (env) => {
  currentBaseUrl = env === 'LOCAL' ? API_CONFIG.LOCAL : API_CONFIG.PROD;
  console.log(`Switched API to: ${currentBaseUrl}`);
};

export const getApiEnv = () => currentBaseUrl;

// --- API CALLS ---

export const searchPolicies = async (question) => {
  try {
    const response = await axios.post(`${currentBaseUrl}/query_policy`, { question });
    return response.data;
  } catch (error) {
    console.error("Search Error:", error);
    throw error;
  }
};

export const askDocument = async (docId, question) => {
  try {
    const response = await axios.post(`${currentBaseUrl}/query_document_details`, { 
      doc_id: docId, 
      question 
    });
    return response.data;
  } catch (error) {
    console.error("Doc Query Error:", error);
    throw error;
  }
};