import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation';
import { Audio } from 'expo-av';
import { MaterialIcons, Feather, Ionicons, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/config';

type ProcessingScreenRouteProp = RouteProp<RootStackParamList, 'Processing'>;

export default function Processing() {
  const route = useRoute<ProcessingScreenRouteProp>();
  const navigation = useNavigation();
  const { recordingUri } = route.params;
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Processing your recording...');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const subject = route.params.subject || 'Other';
  const [transcriptionResult, setTranscriptionResult] = useState<{
    class: string;
    recordingUri: string;
    full_transcription: string;
    insights: {
      summary: string;
      key_points: string[];
      test_questions: string[];
      glossary: { term: string; definition: string }[];
      lecture_structure: string[];
      action_items: string[];
      study_plan: Record<string, string>;
    };
  } | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  const transcribeAudio = async (audioUri: string) => {
    try {
      const formData = new FormData();
      const fileName = audioUri.split('/').pop();
      const fileType = fileName?.split('.').pop();

      formData.append('file', {
        uri: audioUri,
        name: fileName || 'recording.m4a',
        type: `audio/${fileType || 'm4a'}`,
      } as any);

      const response = await fetch(`${API_URL}/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }
      const settings = await AsyncStorage.getItem('settings');
      const className = settings ? JSON.parse(settings).class : 'Other';
      return {
        class: subject,
        recordingUri: recordingUri,
        full_transcription: result.full_transcription,
        insights: result.insights,
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };

  const navigateToResults = () => {
    if (transcriptionResult) {
      navigation.navigate('Results', {
        subject: transcriptionResult.class,
        recordingUri: transcriptionResult.recordingUri,
        insights: transcriptionResult.insights,
        fullText: transcriptionResult.full_transcription,
      });
    }
  };

  useEffect(() => {
    const startWaveAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim1, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(waveAnim2, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim2, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(1000),
          Animated.timing(waveAnim3, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim3, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startWaveAnimation();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const processRecording = async () => {
      if (!recordingUri) {
        setStatus('No recording found');
        return;
      }

      try {
        setStatus('Loading audio...');
        await simulateProgress(10);

        setStatus('Analyzing content...');
        await simulateProgress(30);

        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: false }
        );
        setSound(sound);

        setStatus('Transcribing speech...');
        const transcription = await transcribeAudio(recordingUri);
        setTranscriptionResult(transcription);
        await simulateProgress(60);

        setStatus('Finalizing results...');
        await simulateProgress(100);
      } catch (error) {
        console.error('Processing error:', error);
        setStatus('Error processing recording');
      }
    };

    processRecording();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      pulseAnim.stopAnimation();
      waveAnim1.stopAnimation();
      waveAnim2.stopAnimation();
      waveAnim3.stopAnimation();
    };
  }, [recordingUri]);

  const simulateProgress = (target: number) => {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= target) {
            clearInterval(interval);
            resolve();
            return target;
          }
          return prev + 1;
        });
      }, 20);
    });
  };

  const togglePlayback = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16 dark:bg-[#121212]">
      <View className="flex-1 items-center justify-center">
        <View className="relative mb-10 h-56 w-56 items-center justify-center">
          <Animated.View
            className="absolute h-full w-full rounded-full border-2 border-indigo-400/30 dark:border-indigo-700/30"
            style={{
              transform: [
                { scale: waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
              ],
              opacity: waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
            }}
          />
          <Animated.View
            className="absolute h-full w-full rounded-full border-2 border-indigo-400/40 dark:border-indigo-700/40"
            style={{
              transform: [
                { scale: waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
              ],
              opacity: waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
            }}
          />
          <Animated.View
            className="absolute h-full w-full rounded-full border-2 border-indigo-400/50 dark:border-indigo-700/50"
            style={{
              transform: [
                { scale: waveAnim3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) },
              ],
              opacity: waveAnim3.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
            }}
          />

          <Animated.View
            className={`h-40 w-40 items-center justify-center rounded-full ${
              isPlaying ? 'bg-indigo-500 dark:bg-indigo-600' : 'bg-indigo-400 dark:bg-indigo-500'
            }`}
            style={{ transform: [{ scale: pulseAnim }] }}>
            {progress < 100 ? (
              <AntDesign name="loading1" size={40} color="white" />
            ) : isPlaying ? (
              <Ionicons name="pause" size={40} color="white" />
            ) : (
              <Feather name="play" size={40} color="white" />
            )}
          </Animated.View>
        </View>

        <Text className="mb-2 text-center text-2xl font-bold text-gray-800 dark:text-gray-100">
          {status}
        </Text>

        <Text className="mb-6 max-w-xs text-center text-gray-500 dark:text-gray-400">
          {progress < 30
            ? 'Preparing your audio for analysis'
            : progress < 60
              ? 'Converting speech to text'
              : progress < 100
                ? 'Generating your insights'
                : 'Processing complete!'}
        </Text>

        <View className="mb-4 h-3 w-full max-w-sm overflow-hidden rounded-full bg-gray-200 dark:bg-[#1E1E1E]">
          <View
            className="h-full rounded-full bg-indigo-500 dark:bg-indigo-600"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="mb-8 text-lg font-medium text-indigo-500 dark:text-indigo-400">
          {progress}% complete
        </Text>

        <TouchableOpacity
          className="flex flex-row items-center rounded-full shadow-xl"
          onPress={togglePlayback}
          activeOpacity={0.8}>
          <Text className="text-lg font-bold text-white">{isPlaying ? 'Pause' : 'Play'}</Text>
          <Feather name={isPlaying ? 'pause' : 'play'} size={20} color="white" className="ml-2" />
        </TouchableOpacity>

        {progress === 100 && (
          <TouchableOpacity
            className="mt-4 flex flex-row items-center rounded-full bg-indigo-500 px-6 py-3 shadow-xl dark:bg-indigo-600"
            onPress={navigateToResults}
            activeOpacity={0.8}>
            <Text className="text-lg font-bold text-white">View Results</Text>
            <Feather name="chevron-right" size={20} color="white" className="ml-2" />
          </TouchableOpacity>
        )}

        {progress < 100 && (
          <View className="mt-8 flex-row items-center">
            <MaterialIcons
              name="hourglass-top"
              size={28}
              color="#6366f1"
              style={{ marginRight: 8 }}
            />
            <Text className="text-indigo-500 dark:text-indigo-400">Processing...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
