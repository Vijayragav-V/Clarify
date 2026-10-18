import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '../services/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestPrep() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [prepMaterial, setPrepMaterial] = useState<any | null>(null);
  const [userSubjects, setUserSubjects] = useState<string[]>([]);

  useEffect(() => {
    const loadUserSubjects = async () => {
      try {
        const settings = await AsyncStorage.getItem('settings');
        if (settings) {
          const parsedSettings = JSON.parse(settings);
          setUserSubjects(parsedSettings.classes || []);
        }
      } catch (error) {
        console.error('Error loading user subjects:', error);
      }
    };

    loadUserSubjects();
  }, []);

  const fetchTestPrep = async (subject: string) => {
    if (!subject) return;

    setLoading(true);
    setSelectedSubject(subject);
    setPrepMaterial(null);

    try {
      const response = await axios.get(`${API_URL}/test-prep`, {
        params: {
          subject,
          level: 'University'
        }
      });

      console.log('Test prep response:', response.data);

      // Format the response data for display
      const formattedData = {
        keyConcepts: formatSection(response.data.keyConcepts),
        formulas: formatSection(response.data.formulas),
        studyStrategies: formatSection(response.data.studyStrategies, true),
        commonQuestions: formatSection(response.data.commonQuestions)
      };
      
      setPrepMaterial(formattedData);
    } catch (error) {
      console.error('Error fetching test prep:', error);
      Alert.alert('Error', 'Failed to fetch test preparation material');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to clean up section content
  const formatSection = (items: string[] | undefined, isNumbered = false) => {
    if (!items) return [];
    
    return items.map(item => {
      // Remove any markdown formatting
      let cleanItem = item.replace(/\*\*/g, '')
                         .replace(/^- /, '')
                         .replace(/^\d+\. /, '')
                         .trim();
      
      // Capitalize first letter
      if (cleanItem.length > 0) {
        cleanItem = cleanItem.charAt(0).toUpperCase() + cleanItem.slice(1);
      }
      
      return cleanItem;
    }).filter(item => item.length > 0);
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16 dark:bg-[#121212]">
      {/* Header */}
      <View className="mb-8 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="rounded-full p-2">
          <ChevronLeft size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800 dark:text-gray-100">Test Preparation</Text>
        <View className="w-6" />
      </View>

      {!prepMaterial ? (
        <ScrollView>
          <Text className="mb-6 text-lg text-gray-600 dark:text-gray-300">
            Select a subject to get a comprehensive test preparation plan:
          </Text>

          {userSubjects.length === 0 ? (
            <View className="mt-4 p-4 bg-gray-100 rounded-lg dark:bg-[#1E1E1E]">
              <Text className="text-gray-600 dark:text-gray-300">
                No subjects found in your settings.
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Settings')}
                className="mt-2"
              >
                <Text className="text-indigo-600 dark:text-indigo-400 font-medium">
                  Add subjects in settings →
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            userSubjects.map((subject) => (
              <TouchableOpacity
                key={subject}
                onPress={() => fetchTestPrep(subject)}
                disabled={loading}
                className={`mb-4 rounded-xl p-4 ${selectedSubject === subject && loading ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-100 dark:bg-[#1E1E1E]'}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-gray-800 dark:text-white">{subject}</Text>
                  {selectedSubject === subject && loading ? (
                    <ActivityIndicator color="#6366f1" />
                  ) : (
                    <ChevronRight size={20} color="#6366f1" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => setPrepMaterial(null)}
            className="mb-4 self-start rounded-full bg-indigo-100 px-4 py-2 dark:bg-indigo-900"
          >
            <Text className="text-indigo-600 dark:text-indigo-300">← Back to subjects</Text>
          </TouchableOpacity>

          <Text className="mb-6 text-2xl font-bold text-gray-800 dark:text-white">
            {selectedSubject} Test Preparation
          </Text>

          {/* Key Concepts Section */}
          {prepMaterial.keyConcepts && prepMaterial.keyConcepts.length > 0 && (
            <View className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-[#1E1E1E]">
              <Text className="mb-3 text-lg font-bold text-gray-800 dark:text-white">Key Concepts</Text>
              {prepMaterial.keyConcepts.map((concept: string, idx: number) => (
                <View key={idx} className="flex-row mb-2">
                  <Text className="text-gray-800 dark:text-gray-200">•</Text>
                  <Text className="ml-2 flex-1 text-gray-800 dark:text-gray-200">{concept}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Formulas Section */}
          {prepMaterial.formulas && prepMaterial.formulas.length > 0 && (
            <View className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-[#1E1E1E]">
              <Text className="mb-3 text-lg font-bold text-gray-800 dark:text-white">Important Formulas & Facts</Text>
              {prepMaterial.formulas.map((formula: string, idx: number) => (
                <View key={idx} className="flex-row mb-2">
                  <Text className="text-gray-800 dark:text-gray-200">•</Text>
                  <Text className="ml-2 flex-1 text-gray-800 dark:text-gray-200">{formula}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Study Strategies Section */}
          {prepMaterial.studyStrategies && prepMaterial.studyStrategies.length > 0 && (
            <View className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-[#1E1E1E]">
              <Text className="mb-3 text-lg font-bold text-gray-800 dark:text-white">Study Strategies</Text>
              {prepMaterial.studyStrategies.map((strategy: string, idx: number) => (
                <View key={idx} className="flex-row mb-2">
                  <Text className="text-gray-800 dark:text-gray-200">{idx + 1}.</Text>
                  <Text className="ml-2 flex-1 text-gray-800 dark:text-gray-200">{strategy}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Common Questions Section */}
          {prepMaterial.commonQuestions && prepMaterial.commonQuestions.length > 0 && (
            <View className="mb-6 rounded-xl bg-gray-100 p-4 dark:bg-[#1E1E1E]">
              <Text className="mb-3 text-lg font-bold text-gray-800 dark:text-white">Common Questions</Text>
              {prepMaterial.commonQuestions.map((question: string, idx: number) => (
                <View key={idx} className="flex-row mb-2">
                  <Text className="text-gray-800 dark:text-gray-200">•</Text>
                  <Text className="ml-2 flex-1 text-gray-800 dark:text-gray-200">{question}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
