// src/api.js
import axios from 'axios';

export const API_CONFIG = {
  PROD: 'https://polanyze-dev.azurewebsites.net/api',
  LOCAL: 'http://localhost:7071/api'
};

let currentBaseUrl = API_CONFIG.PROD;

export const setApiEnv = (env) => {
  currentBaseUrl = env === 'LOCAL' ? API_CONFIG.LOCAL : API_CONFIG.PROD;
  console.log(`Switched API to: ${currentBaseUrl}`);
};

// --- API CALLS ---

export const searchPolicies = async (question) => {
  const response = await axios.post(`${currentBaseUrl}/query_policy`, { question });
  return response.data;
};

export const askDocument = async (docId, question) => {
  const response = await axios.post(`${currentBaseUrl}/query_document_details`, { 
    doc_id: docId, 
    question 
  });
  return response.data;
};

// NEW: Ingest Policy
export const ingestPolicy = async (formData) => {
  try {
    // formData should match the Python ingest_policy req_body structure
    const response = await axios.post(`${currentBaseUrl}/ingest_policy`, formData);
    return response.data;
  } catch (error) {
    console.error("Ingest Error:", error);
    throw error;
  }
};

// NEW: Mock Update (Since backend update endpoint wasn't provided)
export const updatePolicy = async (docId, updatedData) => {
  console.log(`Mocking update for ${docId}`, updatedData);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};