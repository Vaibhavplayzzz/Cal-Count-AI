/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, ArrowRight, Activity, PieChart, Utensils, Sparkles, Target, Zap, ChevronRight, Plus, ChevronLeft, Apple, Scale, Clock, User, Moon, Sun, Bed, Coffee, Check, ChefHat, Store, Leaf, Beef, Droplets, Brain, Heart, Users, Coins, Camera, X, RefreshCw, AlertCircle, Info, Scan, Shield, Dumbbell } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState(25);
  const [height, setHeight] = useState(170);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [goal, setGoal] = useState<string | null>(null);
  const [weight, setWeight] = useState(50);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [targetWeight, setTargetWeight] = useState(45);
  const [targetWeightUnit, setTargetWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [sleepTime, setSleepTime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [morningTime, setMorningTime] = useState('08:00');
  const [lunchTime, setLunchTime] = useState('13:00');
  const [dinnerTime, setDinnerTime] = useState('19:30');
  const [showMorning, setShowMorning] = useState(true);
  const [showLunch, setShowLunch] = useState(true);
  const [showDinner, setShowDinner] = useState(true);
  const [preWorkoutTime, setPreWorkoutTime] = useState('07:00');
  const [postWorkoutTime, setPostWorkoutTime] = useState('18:00');
  const [showPreWorkout, setShowPreWorkout] = useState(true);
  const [showPostWorkout, setShowPostWorkout] = useState(true);
  const [morningSnackTime, setMorningSnackTime] = useState('11:00');
  const [afternoonSnackTime, setAfternoonSnackTime] = useState('15:30');
  const [eveningSnackTime, setEveningSnackTime] = useState('21:00');
  const [nightSnackTime, setNightSnackTime] = useState('23:00');
  const [showMorningSnack, setShowMorningSnack] = useState(true);
  const [showAfternoonSnack, setShowAfternoonSnack] = useState(true);
  const [showEveningSnack, setShowEveningSnack] = useState(true);
  const [showNightSnack, setShowNightSnack] = useState(true);
  
  // Dietary Preferences State
  const [dietType, setDietType] = useState<string>('no specific diet');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [otherAllergy, setOtherAllergy] = useState('');
  const [eatOutFrequency, setEatOutFrequency] = useState<string | null>(null);
  const [cookAtHomeFrequency, setCookAtHomeFrequency] = useState<string | null>(null);
  const [waterIntake, setWaterIntake] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [reminders, setReminders] = useState<{ meals: boolean; report: boolean }>({ meals: true, report: true });
  const [planProgress, setPlanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [manualEntry, setManualEntry] = useState({ name: '', cal: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [weeklyTargets, setWeeklyTargets] = useState([
    { id: 1, text: 'Drink 3L water daily', completed: false },
    { id: 2, text: 'No sugar for 5 days', completed: true },
  ]);
  const [newTarget, setNewTarget] = useState('');
  const [workoutPlans, setWorkoutPlans] = useState([
    { id: 1, day: 'Monday', exercise: 'Morning Yoga', time: '15 mins' },
    { id: 2, day: 'Wednesday', exercise: 'Cardio Blast', time: '30 mins' },
  ]);
  const [newWorkoutDay, setNewWorkoutDay] = useState('Monday');
  const [newWorkoutExercise, setNewWorkoutExercise] = useState('');
  const [newWorkoutTime, setNewWorkoutTime] = useState('');
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'type' | 'time' | null>(null);
  const [customRemindersList, setCustomRemindersList] = useState([
    { id: 1, type: 'Breakfast', time: '08:30', active: true },
    { id: 2, type: 'Lunch', time: '13:00', active: true },
    { id: 3, type: 'Dinner', time: '19:30', active: true },
    { id: 4, type: 'Water', time: '10:00', active: false },
  ]);
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderType, setNewReminderType] = useState('Breakfast');
  const [editedDisplayName, setEditedDisplayName] = useState('');
  const [editedPhotoURL, setEditedPhotoURL] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [userMetadata, setUserMetadata] = useState<{ displayName: string; photoURL: string } | null>(null);

  const [activeNotification, setActiveNotification] = useState<{ title: string; message: string; icon: any } | null>(null);
  const [lastTriggeredTime, setLastTriggeredTime] = useState<string | null>(null);

  const agePickerRef = useRef<HTMLDivElement>(null);
  const heightPickerRef = useRef<HTMLDivElement>(null);
  const weightPickerRef = useRef<HTMLDivElement>(null);
  const targetWeightPickerRef = useRef<HTMLDivElement>(null);

  const totalPages = 20; // Welcome, Gender, Age, Height, Weight, Goals, Target Weight, Fitness Journey, Activity Level, Sleep Schedule, Meal Times, Dietary Preferences, Lifestyle Q1, Lifestyle Q2, Lifestyle Q3, Lifestyle Q4, Reminders, Planning, Dashboard, Scan

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Set user metadata from Firestore
            setUserMetadata({
              displayName: data.displayName || user.displayName || '',
              photoURL: data.photoURL || user.photoURL || ''
            });

            // Restore states
            if (data.page) {
              // If they were on the scanner (20), return them to dashboard (19)
              // as the scanner is a temporary action state.
              const restoredPage = data.page === 20 ? 19 : data.page;
              setPage(restoredPage);
            } else if (page === 1) {
              // If logged in but no page saved, they should start onboarding
              paginate(2);
            }
            if (data.gender) setGender(data.gender);
            if (data.age) setAge(data.age);
            if (data.height) setHeight(data.height);
            if (data.heightUnit) setHeightUnit(data.heightUnit);
            if (data.goal) setGoal(data.goal);
            if (data.weight) setWeight(data.weight);
            if (data.weightUnit) setWeightUnit(data.weightUnit);
            if (data.targetWeight) setTargetWeight(data.targetWeight);
            if (data.targetWeightUnit) setTargetWeightUnit(data.targetWeightUnit);
            if (data.activityLevel) setActivityLevel(data.activityLevel);
            if (data.sleepTime) setSleepTime(data.sleepTime);
            if (data.wakeTime) setWakeTime(data.wakeTime);
            if (data.morningTime) setMorningTime(data.morningTime);
            if (data.lunchTime) setLunchTime(data.lunchTime);
            if (data.dinnerTime) setDinnerTime(data.dinnerTime);
            if (data.showMorning !== undefined) setShowMorning(data.showMorning);
            if (data.showLunch !== undefined) setShowLunch(data.showLunch);
            if (data.showDinner !== undefined) setShowDinner(data.showDinner);
            if (data.preWorkoutTime) setPreWorkoutTime(data.preWorkoutTime);
            if (data.postWorkoutTime) setPostWorkoutTime(data.postWorkoutTime);
            if (data.showPreWorkout !== undefined) setShowPreWorkout(data.showPreWorkout);
            if (data.showPostWorkout !== undefined) setShowPostWorkout(data.showPostWorkout);
            if (data.morningSnackTime) setMorningSnackTime(data.morningSnackTime);
            if (data.afternoonSnackTime) setAfternoonSnackTime(data.afternoonSnackTime);
            if (data.eveningSnackTime) setEveningSnackTime(data.eveningSnackTime);
            if (data.nightSnackTime) setNightSnackTime(data.nightSnackTime);
            if (data.showMorningSnack !== undefined) setShowMorningSnack(data.showMorningSnack);
            if (data.showAfternoonSnack !== undefined) setShowAfternoonSnack(data.showAfternoonSnack);
            if (data.showEveningSnack !== undefined) setShowEveningSnack(data.showEveningSnack);
            if (data.showNightSnack !== undefined) setShowNightSnack(data.showNightSnack);
            if (data.dietType) setDietType(data.dietType);
            if (data.allergies) setAllergies(data.allergies);
            if (data.otherAllergy) setOtherAllergy(data.otherAllergy);
            if (data.eatOutFrequency) setEatOutFrequency(data.eatOutFrequency);
            if (data.cookAtHomeFrequency) setCookAtHomeFrequency(data.cookAtHomeFrequency);
            if (data.waterIntake) setWaterIntake(data.waterIntake);
            if (data.challenges) setChallenges(data.challenges);
            if (data.reminders) setReminders(data.reminders);
          } else if (page === 1) {
            // Document doesn't exist yet, brand new user
            paginate(2);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        // If logged out, reset to page 1
        setPage(1);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveState = async (nextPage: number) => {
    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          page: nextPage === 20 ? 19 : nextPage,
          gender,
          age,
          height,
          heightUnit,
          goal,
          weight,
          weightUnit,
          targetWeight,
          targetWeightUnit,
          activityLevel,
          sleepTime,
          wakeTime,
          morningTime,
          lunchTime,
          dinnerTime,
          showMorning,
          showLunch,
          showDinner,
          preWorkoutTime,
          postWorkoutTime,
          showPreWorkout,
          showPostWorkout,
          morningSnackTime,
          afternoonSnackTime,
          eveningSnackTime,
          nightSnackTime,
          showMorningSnack,
          showAfternoonSnack,
          showEveningSnack,
          showNightSnack,
          dietType,
          allergies,
          otherAllergy,
          eatOutFrequency,
          cookAtHomeFrequency,
          waterIntake,
          challenges,
          reminders,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
      }
    }
  };

  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
      // Data will be loaded by onAuthStateChanged
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log("Login cancelled by user");
      } else {
        console.error("Login failed", error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setPage(1);
      // Reset other states if needed
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    setIsUpdatingProfile(true);
    try {
      // Firebase Auth photoURL has a limit (around 2048 chars). 
      // Base64 images are much larger, so we only update Auth's photoURL if it's a short URL.
      const isShortUrl = editedPhotoURL.length < 2000;
      
      await updateProfile(currentUser, {
        displayName: editedDisplayName,
        photoURL: isShortUrl ? editedPhotoURL : ''
      });

      // Update Firestore (which allows up to 1MB per document)
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: editedDisplayName,
        photoURL: editedPhotoURL,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update local metadata state
      setUserMetadata({
        displayName: editedDisplayName,
        photoURL: editedPhotoURL
      });

      setShowEditProfile(false);
      
      setActiveNotification({
        title: 'Profile Updated',
        message: 'Your profile has been updated successfully!',
        icon: User
      });
      setTimeout(() => setActiveNotification(null), 3000);
    } catch (error) {
      console.error("Profile update failed", error);
      setActiveNotification({
        title: 'Update Failed',
        message: 'Could not update profile. Try a smaller image.',
        icon: AlertCircle
      });
      setTimeout(() => setActiveNotification(null), 3000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Audio play failed (interaction may be required):", e));
  };

  const triggerNotification = (label: string, icon: any) => {
    const title = 'Health Reminder';
    const message = `It's time for your ${label}!`;
    
    // Play Sound
    playNotificationSound();
    
    // Set In-App Notification
    setActiveNotification({ title, message, icon });
    
    // Browser Notification
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body: message });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }

    // Auto-hide after 8 seconds
    setTimeout(() => setActiveNotification(null), 8000);
  };

  useEffect(() => {
    // Check if any reminders are enabled
    const hasAnyActiveReminders = reminders.meals || customRemindersList.some(r => r.active);
    if (!hasAnyActiveReminders) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Don't trigger if we already signaled this minute
      if (lastTriggeredTime === currentTime) return;

      const schedule = [
        { time: morningTime, label: 'Breakfast', show: showMorning, icon: Coffee },
        { time: lunchTime, label: 'Lunch', show: showLunch, icon: Utensils },
        { time: dinnerTime, label: 'Dinner', show: showDinner, icon: Moon },
        { time: preWorkoutTime, label: 'Pre-Workout Meal', show: showPreWorkout, icon: Zap },
        { time: postWorkoutTime, label: 'Post-Workout Meal', show: showPostWorkout, icon: Activity },
        { time: morningSnackTime, label: 'Morning Snack', show: showMorningSnack, icon: Apple },
        { time: afternoonSnackTime, label: 'Afternoon Snack', show: showAfternoonSnack, icon: ChefHat },
        { time: eveningSnackTime, label: 'Evening Snack', show: showEveningSnack, icon: Store },
        { time: nightSnackTime, label: 'Night Snack', show: showNightSnack, icon: Bed },
        { time: wakeTime, label: 'Wake Up', show: true, icon: Sun },
        { time: sleepTime, label: 'Bedtime', show: true, icon: Moon },
        // Add custom reminders
        ...customRemindersList.map(r => ({
          time: r.time,
          label: r.type,
          show: r.active,
          icon: Clock
        }))
      ];

      const active = schedule.find(s => s.show && s.time === currentTime);
      
      if (active) {
        setLastTriggeredTime(currentTime);
        triggerNotification(active.label, active.icon);
      }
    };

    const timer = setInterval(checkReminders, 15000); // Check every 15 seconds for precision
    checkReminders();

    return () => clearInterval(timer);
  }, [reminders, customRemindersList, morningTime, lunchTime, dinnerTime, preWorkoutTime, postWorkoutTime, morningSnackTime, afternoonSnackTime, eveningSnackTime, nightSnackTime, wakeTime, sleepTime, lastTriggeredTime]);

  const analyzeFoodWithGemini = async (base64Image: string) => {
    setIsAnalyzing(true);
    setScanResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analyze this food image. You are a world-class nutritionist capable of identifying global cuisines with extreme accuracy, including:
      - Desi/Indian (e.g., Dal Makhani, Paneer Tikka, Biryani)
      - South Indian (e.g., Masala Dosa, Idli-Sambar, Vada)
      - Western (e.g., Pasta, Steak, Salads)
      - Junk Food (e.g., Samosas, Burgers, Fries, Pizza)
      - Healthy/Diet Food
      
      Identify the specific dish and estimate nutrients for the portion shown. Provide the following information in JSON format:
      {
        "foodName": "string",
        "cuisineType": "string",
        "nutrients": {
          "calories": number,
          "protein": "string",
          "carbs": "string",
          "fats": "string",
          "fiber": "string"
        },
        "advantages": ["string"],
        "disadvantages": ["string"],
        "healthScore": number (1-100)
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              foodName: { type: Type.STRING },
              cuisineType: { type: Type.STRING },
              nutrients: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fats: { type: Type.STRING },
                  fiber: { type: Type.STRING }
                }
              },
              advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
              disadvantages: { type: Type.ARRAY, items: { type: Type.STRING } },
              healthScore: { type: Type.NUMBER }
            }
          }
        }
      });

      const result = JSON.parse(response.text);
      setScanResult(result);
    } catch (error) {
      console.error("Gemini Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (page === 18) {
      setPlanProgress(0);
      interval = setInterval(() => {
        setPlanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => paginate(19), 500); // Small delay after hitting 100%
            return 100;
          }
          // Increment by a random small amount to look natural
          const step = Math.floor(Math.random() * 5) + 1;
          return Math.min(prev + step, 100);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [page]);

  useEffect(() => {
    if (page === 3 && agePickerRef.current) {
      const itemHeight = 68;
      const index = age - 10;
      agePickerRef.current.scrollTop = index * itemHeight;
    }
    if (page === 4 && heightPickerRef.current) {
      const itemHeight = 68;
      const index = heightUnit === 'cm' ? 250 - height : 96 - height; // Descending list
      heightPickerRef.current.scrollTop = index * itemHeight;
    }
    if (page === 5 && weightPickerRef.current) {
      const itemHeight = 80;
      const index = weightUnit === 'kg' ? 200 - weight : 450 - weight; // Descending list
      weightPickerRef.current.scrollTop = index * itemHeight;
    }
    if (page === 7 && targetWeightPickerRef.current) {
      const itemWidth = 80;
      const index = targetWeightUnit === 'kg' ? targetWeight - 30 : targetWeight - 66;
      targetWeightPickerRef.current.scrollLeft = index * itemWidth;
    }
  }, [page, heightUnit, weightUnit, targetWeightUnit]);

  const paginate = (newPage: number) => {
    setDirection(newPage > page ? 1 : -1);
    setPage(newPage);
    saveState(newPage);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] selection:bg-green-100 overflow-x-hidden">
      {/* Global Notification Pop */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 24, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[300] w-[90%] max-w-sm bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-5 flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100">
              <activeNotification.icon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 mb-1">{activeNotification.title}</h4>
              <p className="text-base font-bold text-[#1A1A1A] leading-tight">{activeNotification.message}</p>
            </div>
            <button 
              onClick={() => setActiveNotification(null)}
              className="p-2 text-gray-300 hover:text-[#1A1A1A] transition-all bg-gray-50 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAuthLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8"
            >
              <Zap className="w-12 h-12 text-white fill-white" />
            </motion.div>
            <h1 className="text-2xl font-display font-bold tracking-tight">AI Calorie Tracker</h1>
            <p className="text-gray-400 font-medium mt-2">Restoring your progress...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Progress Bar (Onboarding steps 2-17) */}
      {page > 1 && page < 18 && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1.5 bg-gray-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((page - 1) / 16) * 100}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
          />
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative h-screen w-full overflow-hidden"
        >
          {page === 1 && (
            <div className="h-full flex flex-col justify-between p-8">
              {/* Immersive Background */}
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-green-200/40 to-emerald-200/20 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-orange-100/40 to-yellow-100/20 rounded-full blur-[100px]" />
              
              {/* Top Section: Branding */}
              <div className="relative z-10 flex flex-col items-center space-y-6 mt-8">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse" />
                  <div className="relative bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50">
                    <Flame className="w-10 h-10 text-green-500" />
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="absolute -top-1 -right-1 bg-orange-500 p-1.5 rounded-full shadow-lg"
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>
                </motion.div>

                <div className="text-center space-y-3 px-4">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h1 className="text-4xl font-display font-bold tracking-tight text-[#1A1A1A] leading-[1.1]">
                      Welcome to <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                        Cal Counter AI
                      </span>
                    </h1>
                  </motion.div>
                  
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3"
                  >
                    <p className="text-base text-gray-600 font-medium">
                      Your intelligent nutrition companion.
                    </p>
                    <p className="text-gray-400 text-xs max-w-[280px] mx-auto leading-relaxed">
                      Harness the power of AI to track your calories and analyze macros for a healthier lifestyle.
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Bottom Section: Action */}
              <div className="relative z-10 flex flex-col items-center mb-4 w-full max-w-xs mx-auto space-y-3">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(2)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-5 rounded-[1.5rem] font-bold text-base flex items-center justify-center space-x-3 shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Let's Start</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                {!currentUser && (
                  <motion.button
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, type: 'spring', damping: 20 }}
                    whileHover={!isLoggingIn ? { scale: 1.02, translateY: -2 } : {}}
                    whileTap={!isLoggingIn ? { scale: 0.98 } : {}}
                    onClick={loginWithGoogle}
                    disabled={isLoggingIn}
                    className={`w-full bg-white border border-gray-200 text-[#1A1A1A] py-5 rounded-[1.5rem] font-bold text-base flex items-center justify-center space-x-3 shadow-sm ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoggingIn ? (
                      <div className="w-5 h-5 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
                    ) : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    )}
                    <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
                  </motion.button>
                )}

                {currentUser && (
                  <motion.button
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, type: 'spring', damping: 20 }}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 border border-red-100"
                  >
                    <span>Sign Out ({currentUser.displayName})</span>
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {page === 2 && (
            <div className="h-full flex flex-col justify-between p-8">
              {/* Immersive Background (Same as Page 1 for consistency) */}
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-green-200/40 to-emerald-200/20 rounded-full blur-[120px] opacity-50" />
              
              {/* Back Button - Top Left */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(1)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              {/* Top Section: Question */}
              <div className="relative z-10 flex flex-col items-center space-y-8 mt-16 w-full">
                <div className="text-center space-y-3 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight"
                  >
                    What is your <br />
                    <span className="text-green-600">Gender?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium"
                  >
                    Select to personalize your experience.
                  </motion.p>
                </div>

                <div className="w-full max-w-sm space-y-3">
                  {[
                    { id: 'male', label: 'Male', color: 'bg-blue-50 text-blue-500' },
                    { id: 'female', label: 'Female', color: 'bg-pink-50 text-pink-500' },
                    { id: 'other', label: 'Other', color: 'bg-purple-50 text-purple-500' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (i * 0.05) }}
                      onClick={() => setGender(item.id)}
                      className={`bg-white/70 backdrop-blur-sm p-5 rounded-[2rem] border shadow-sm flex items-center justify-between group transition-all cursor-pointer ${
                        gender === item.id ? 'border-green-500 ring-4 ring-green-500/10' : 'border-white hover:border-green-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center`}>
                          <User className="w-5 h-5" />
                        </div>
                        <div className="text-lg font-bold">{item.label}</div>
                      </div>
                      {gender === item.id && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4 text-white rotate-45" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom Section: Action (Matches Page 1) */}
              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto min-h-[88px]">
                <AnimatePresence>
                  {gender && (
                    <motion.button
                      key="gender-continue"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 40, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => paginate(3)}
                      className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>Continue</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {page === 3 && (
            <div className="h-full flex flex-col justify-between p-8">
              <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-200/30 to-purple-200/20 rounded-full blur-[120px] opacity-50" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(2)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-8 mt-16 w-full">
                <div className="text-center space-y-3 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight"
                  >
                    How old <br />
                    <span className="text-green-600">are you?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium"
                  >
                    Scroll to select your age.
                  </motion.p>
                </div>

                {/* Scrollable Age Picker */}
                <div className="relative w-full max-w-[200px] h-[320px] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="h-1/3 bg-gradient-to-b from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent" />
                    <div className="h-1/3" />
                    <div className="h-1/3 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent" />
                  </div>
                  
                  <div className="absolute top-1/2 left-0 right-0 h-20 -translate-y-1/2 border-y-2 border-green-500/20 pointer-events-none z-10" />

                  <div 
                    ref={agePickerRef}
                    className="w-full h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-[120px]"
                    onScroll={(e) => {
                      const element = e.currentTarget;
                      const scrollPos = element.scrollTop;
                      const itemHeight = 68; // Height of each number + spacing
                      const index = Math.round(scrollPos / itemHeight);
                      const newAge = index + 10;
                      if (newAge !== age) {
                        setAge(Math.max(10, Math.min(100, newAge)));
                      }
                    }}
                  >
                    <div className="flex flex-col items-center">
                      {Array.from({ length: 91 }, (_, i) => i + 10).map((val) => (
                        <div 
                          key={`age-${val}`}
                          className={`h-[68px] flex items-center justify-center text-5xl font-display font-bold transition-all duration-300 snap-center ${
                            age === val ? 'text-[#1A1A1A] scale-125' : 'text-gray-200 scale-75'
                          }`}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(4)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 4 && (
            <div className="h-full flex flex-col justify-between p-8">
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-orange-200/30 to-yellow-200/20 rounded-full blur-[120px] opacity-50" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(3)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-6 mt-16 w-full">
                <div className="text-center space-y-3 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight"
                  >
                    What is your <br />
                    <span className="text-green-600">height?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium"
                  >
                    We need this to calculate your BMI.
                  </motion.p>
                </div>

                {/* Unit Toggle */}
                <div className="flex bg-gray-100/80 p-1 rounded-2xl w-full max-w-[240px]">
                  <button
                    onClick={() => {
                      setHeightUnit('cm');
                      setHeight(170);
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      heightUnit === 'cm' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-400'
                    }`}
                  >
                    Metric (cm)
                  </button>
                  <button
                    onClick={() => {
                      setHeightUnit('ft');
                      setHeight(68); // 5'8"
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      heightUnit === 'ft' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-400'
                    }`}
                  >
                    Imperial (ft/in)
                  </button>
                </div>

                {/* Scrollable Height Picker */}
                <div className="relative w-full max-w-[200px] h-[280px] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none z-20">
                    <div className="h-1/3 bg-gradient-to-b from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent" />
                    <div className="h-1/3" />
                    <div className="h-1/3 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/80 to-transparent" />
                  </div>
                  
                  <div className="absolute top-1/2 left-0 right-0 h-20 -translate-y-1/2 border-y-2 border-green-500/20 pointer-events-none z-10" />

                  <div 
                    ref={heightPickerRef}
                    className="w-full h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-[100px]"
                    onScroll={(e) => {
                      const element = e.currentTarget;
                      const scrollPos = element.scrollTop;
                      const itemHeight = 68;
                      const index = Math.round(scrollPos / itemHeight);
                      
                      if (heightUnit === 'cm') {
                        const newHeight = 250 - index; // Descending: 250, 249...
                        if (newHeight !== height) {
                          setHeight(Math.max(100, Math.min(250, newHeight)));
                        }
                      } else {
                        const newHeight = 96 - index; // 8'0" = 96 inches
                        if (newHeight !== height) {
                          setHeight(Math.max(36, Math.min(96, newHeight)));
                        }
                      }
                    }}
                  >
                    <div className="flex flex-col items-center">
                      {heightUnit === 'cm' ? (
                        Array.from({ length: 151 }, (_, i) => 250 - i).map((val) => (
                          <div 
                            key={`h-cm-${val}`}
                            className={`h-[68px] flex items-center justify-center text-5xl font-display font-bold transition-all duration-300 snap-center ${
                              height === val ? 'text-[#1A1A1A] scale-125' : 'text-gray-200 scale-75'
                            }`}
                          >
                            {val}<span className="text-sm ml-1 text-gray-400">cm</span>
                          </div>
                        ))
                      ) : (
                        Array.from({ length: 61 }, (_, i) => 96 - i).map((val) => (
                          <div 
                            key={`h-ft-${val}`}
                            className={`h-[68px] flex items-center justify-center text-4xl font-display font-bold transition-all duration-300 snap-center ${
                              height === val ? 'text-[#1A1A1A] scale-125' : 'text-gray-200 scale-75'
                            }`}
                          >
                            {Math.floor(val / 12)}'{val % 12}"
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(5)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 5 && (
            <div className="h-full flex flex-col justify-between p-8">
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-[120px] opacity-50" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(4)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-6 mt-12 w-full">
                <div className="text-center space-y-3 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight"
                  >
                    What is your <br />
                    <span className="text-green-600">current weight?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium"
                  >
                    This is your strong point - <span className="text-[#1A1A1A]">Be honest</span>
                  </motion.p>
                </div>

                {/* Unit Toggle */}
                <div className="flex bg-gray-100/80 p-1 rounded-2xl w-full max-w-[240px]">
                  <button
                    onClick={() => {
                      setWeightUnit('kg');
                      setWeight(70);
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      weightUnit === 'kg' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-400'
                    }`}
                  >
                    Metric (kg)
                  </button>
                  <button
                    onClick={() => {
                      setWeightUnit('lb');
                      setWeight(154);
                    }}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      weightUnit === 'lb' ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-gray-400'
                    }`}
                  >
                    Imperial (lb)
                  </button>
                </div>

                {/* Vertical Weight Picker - Hardware Style */}
                <div className="relative w-full max-w-[240px] h-[300px] flex items-center justify-center">
                  {/* Glass Container */}
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white/60 shadow-xl" />
                  
                  {/* Selection Indicator */}
                  <div className="absolute top-1/2 left-0 right-0 h-20 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                    <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                  </div>

                  <div className="absolute inset-0 pointer-events-none z-10 rounded-[3rem] overflow-hidden">
                    <div className="h-1/4 bg-gradient-to-b from-white/80 to-transparent" />
                    <div className="h-1/2" />
                    <div className="h-1/4 bg-gradient-to-t from-white/80 to-transparent" />
                  </div>
                  
                  <div 
                    ref={weightPickerRef}
                    className="w-full h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-[130px] relative z-0"
                    onScroll={(e) => {
                      const element = e.currentTarget;
                      const scrollPos = element.scrollTop;
                      const itemHeight = 80;
                      const index = Math.round(scrollPos / itemHeight);
                      
                      if (weightUnit === 'kg') {
                        const newWeight = 200 - index;
                        if (newWeight !== weight) {
                          setWeight(Math.max(30, Math.min(200, newWeight)));
                        }
                      } else {
                        const newWeight = 450 - index;
                        if (newWeight !== weight) {
                          setWeight(Math.max(66, Math.min(450, newWeight)));
                        }
                      }
                    }}
                  >
                    <div className="flex flex-col items-center">
                      {(weightUnit === 'kg' ? Array.from({ length: 171 }, (_, i) => 200 - i) : Array.from({ length: 385 }, (_, i) => 450 - i)).map((val) => (
                        <div 
                          key={`w-${val}`}
                          className={`h-[80px] flex items-center justify-center transition-all duration-300 snap-center ${
                            weight === val ? 'opacity-100 scale-110' : 'opacity-20 scale-90'
                          }`}
                        >
                          <span className={`font-display font-bold tracking-tighter ${
                            weight === val ? 'text-6xl text-[#1A1A1A]' : 'text-4xl text-gray-400'
                          }`}>
                            {val}
                          </span>
                          {weight === val && (
                            <span className="text-xl ml-2 font-bold text-green-600 mt-4">{weightUnit}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(6)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 6 && (
            <div className="h-full flex flex-col justify-between p-8">
              <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-green-200/30 to-emerald-200/20 rounded-full blur-[120px] opacity-50" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(5)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-8 mt-16 w-full">
                <div className="text-center space-y-3 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight"
                  >
                    What is your <br />
                    <span className="text-green-600">fitness goals?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium"
                  >
                    Choose your prime health objective
                  </motion.p>
                </div>

                <div className="w-full space-y-4 max-w-sm">
                  {[
                    { id: 'lose', label: 'Lose Weight', icon: '📉' },
                    { id: 'build', label: 'Build Muscle', icon: '💪' },
                    { id: 'maintain', label: 'Maintain Weight', icon: '⚖️' }
                  ].map((option, idx) => (
                    <motion.button
                      key={option.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setGoal(option.id)}
                      className={`w-full p-6 rounded-[2rem] flex items-center justify-between transition-all duration-300 ${
                        goal === option.id 
                          ? 'bg-[#1A1A1A] text-white shadow-xl scale-[1.02]' 
                          : 'bg-white/80 backdrop-blur-md border border-white/50 text-gray-600 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">{option.icon}</span>
                        <span className="font-bold text-lg">{option.label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        goal === option.id ? 'border-green-500 bg-green-500' : 'border-gray-200'
                      }`}>
                        {goal === option.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                {goal && (
                  <motion.button
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                    whileHover={{ scale: 1.02, translateY: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => paginate(7)}
                    className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Continue</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {page === 7 && (
            <div className="h-full flex flex-col justify-between p-8 relative overflow-hidden">
              {/* Atmospheric Background */}
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(6)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-10 mt-12 w-full">
                <div className="text-center space-y-3 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight"
                  >
                    What is your <br />
                    <span className="text-green-600">target weight?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium"
                  >
                    Adjust to match your {goal === 'build' ? 'build muscle' : goal === 'lose' ? 'weight loss' : 'maintenance'} goal
                  </motion.p>
                </div>

                {/* Unit Toggle - Glassmorphism */}
                <div className="flex bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-[1.5rem] w-full max-w-[260px] border border-white/50 shadow-inner">
                  <button
                    onClick={() => {
                      setTargetWeightUnit('kg');
                      setTargetWeight(65);
                    }}
                    className={`flex-1 py-2.5 rounded-[1.2rem] text-sm font-bold transition-all duration-300 ${
                      targetWeightUnit === 'kg' ? 'bg-white shadow-md text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Metric (kg)
                  </button>
                  <button
                    onClick={() => {
                      setTargetWeightUnit('lb');
                      setTargetWeight(143);
                    }}
                    className={`flex-1 py-2.5 rounded-[1.2rem] text-sm font-bold transition-all duration-300 ${
                      targetWeightUnit === 'lb' ? 'bg-white shadow-md text-[#1A1A1A]' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Imperial (lb)
                  </button>
                </div>

                {/* Horizontal Weight Picker - Premium Ruler */}
                <div className="relative w-full flex flex-col items-center justify-center space-y-8">
                  <div className="relative">
                    <motion.div 
                      key={`tw-val-${targetWeight}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-7xl font-display font-bold text-[#1A1A1A] tracking-tighter flex items-baseline"
                    >
                      {targetWeight}
                      <span className="text-2xl ml-2 text-green-600 font-bold uppercase tracking-widest">{targetWeightUnit}</span>
                    </motion.div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-green-500/20 rounded-full blur-sm" />
                  </div>

                  <div className="relative w-full h-32 flex items-center justify-center">
                    {/* Glass Ruler Container */}
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-[2.5rem] border border-white/60 shadow-lg pointer-events-none" />
                    
                    {/* Center Indicator Needle */}
                    <div className="absolute top-0 bottom-0 w-1 bg-green-500 rounded-full z-30 shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full shadow-lg" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full shadow-lg" />
                    </div>
                    
                    <div className="absolute inset-0 pointer-events-none z-20 rounded-[2.5rem] overflow-hidden">
                      <div className="w-1/4 h-full absolute left-0 bg-gradient-to-r from-white/90 to-transparent" />
                      <div className="w-1/4 h-full absolute right-0 bg-gradient-to-l from-white/90 to-transparent" />
                    </div>

                    <div 
                      ref={targetWeightPickerRef}
                      className="w-full h-full overflow-x-auto scrollbar-hide snap-x snap-mandatory px-[calc(50%-40px)] relative z-10"
                      onScroll={(e) => {
                        const element = e.currentTarget;
                        const scrollPos = element.scrollLeft;
                        const itemWidth = 80;
                        const index = Math.round(scrollPos / itemWidth);
                        
                        if (targetWeightUnit === 'kg') {
                          const newWeight = 30 + index;
                          if (newWeight !== targetWeight) {
                            setTargetWeight(Math.max(30, Math.min(200, newWeight)));
                          }
                        } else {
                          const newWeight = 66 + index;
                          if (newWeight !== targetWeight) {
                            setTargetWeight(Math.max(66, Math.min(450, newWeight)));
                          }
                        }
                      }}
                    >
                      <div className="flex h-full items-center" style={{ width: targetWeightUnit === 'kg' ? '13680px' : '30800px' }}>
                        {(targetWeightUnit === 'kg' ? Array.from({ length: 171 }, (_, i) => 30 + i) : Array.from({ length: 385 }, (_, i) => 66 + i)).map((val) => (
                          <div 
                            key={`tw-r-${val}`}
                            className="w-[80px] flex-shrink-0 flex flex-col items-center snap-center"
                          >
                            <div className={`w-0.5 rounded-full transition-all duration-300 ${
                              val % 5 === 0 ? 'h-10 bg-gray-400' : 'h-5 bg-gray-200'
                            } ${targetWeight === val ? 'bg-green-500 h-14 w-1' : ''}`} />
                            {val % 5 === 0 && (
                              <span className={`mt-3 text-sm font-bold transition-all duration-300 ${
                                targetWeight === val ? 'text-green-600 scale-110' : 'text-gray-400'
                              }`}>
                                {val}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(8)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 8 && (
            <div className="h-full flex flex-col justify-between p-8 relative overflow-hidden">
              {/* Atmospheric Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-950 via-[#0a0a0a] to-[#0a0a0a]" />
              <div className="absolute top-1/4 -left-1/4 w-full h-full bg-green-500/20 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-1/4 -right-1/4 w-full h-full bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(7)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center justify-center flex-1 space-y-12">
                <div className="text-center space-y-4 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl font-display font-bold leading-tight text-white"
                  >
                    Your <br />
                    <span className="text-green-500">fitness journey</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/40 text-base font-medium max-w-[280px] mx-auto italic"
                  >
                    "Awareness is the first step to better health"
                  </motion.p>
                </div>

                <motion.div 
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, delay: 0.3 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl animate-pulse" />
                  <div className="relative w-32 h-32 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)] border border-white/20">
                    <Activity className="w-16 h-16 text-[#0a0a0a]" />
                  </div>
                </motion.div>

                <div className="text-center space-y-2 px-8">
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/80 text-lg font-medium leading-relaxed"
                  >
                    When you know your nutrition, <br />
                    <span className="text-green-500 font-bold underline decoration-green-500/30 underline-offset-8">you control your progress</span>
                  </motion.p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, delay: 0.7 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(9)}
                  className="group relative w-full bg-white text-[#0a0a0a] py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue journey</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 9 && (
            <div className="h-full flex flex-col justify-between p-8 relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-green-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(8)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-6 mt-10 w-full">
                <div className="text-center space-y-2 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-display font-bold leading-tight"
                  >
                    How active <br />
                    <span className="text-green-600">you are?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-xs font-medium"
                  >
                    Thinking about your typical days
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
                  {[
                    { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise', icon: Clock },
                    { id: 'lightly', label: 'Lightly Active', desc: 'Exercise 1-3 days/week', icon: Sparkles },
                    { id: 'moderately', label: 'Moderately Active', desc: 'Exercise 3-5 days/week', icon: Activity },
                    { id: 'very', label: 'Very Active', desc: 'Exercise 6-7 days/week', icon: Zap },
                  ].map((level, i) => (
                    <motion.button
                      key={level.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + (i * 0.1) }}
                      onClick={() => setActivityLevel(level.id)}
                      className={`group relative p-4 rounded-[1.5rem] flex items-center justify-between border-2 transition-all duration-300 ${
                        activityLevel === level.id 
                          ? 'border-green-500 bg-green-50 shadow-[0_10px_30px_rgba(34,197,94,0.1)]' 
                          : 'border-white bg-white hover:border-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          activityLevel === level.id ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                        }`}>
                          <level.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h4 className={`font-bold text-sm transition-colors ${
                            activityLevel === level.id ? 'text-green-700' : 'text-[#1A1A1A]'
                          }`}>{level.label}</h4>
                          <p className={`text-[10px] font-medium transition-colors ${
                            activityLevel === level.id ? 'text-green-600' : 'text-gray-400'
                          }`}>{level.desc}</p>
                        </div>
                      </div>
                      {activityLevel === level.id && (
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Plus className="w-3 h-3 text-white rotate-45" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <AnimatePresence>
                  {activityLevel && (
                    <motion.button
                      key="activity-continue"
                      initial={{ y: 40, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 40, opacity: 0 }}
                      transition={{ type: 'spring', damping: 20 }}
                      whileHover={{ scale: 1.02, translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => paginate(10)}
                      className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>Continue</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {page === 10 && (
            <div className="h-full flex flex-col justify-between p-8 relative overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
              
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => paginate(9)}
                className="absolute top-8 left-8 z-50 p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600 hover:text-[#1A1A1A] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="relative z-10 flex flex-col items-center space-y-6 mt-10 w-full">
                <div className="text-center space-y-2 px-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-3xl font-display font-bold leading-tight"
                  >
                    What is your <br />
                    <span className="text-blue-600">sleeping schedule?</span>
                  </motion.h2>
                  <div className="space-y-1">
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-gray-500 text-xs font-medium"
                    >
                      Sleeping effects your metabolism and hunger
                    </motion.p>
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="text-blue-500 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Add 8 hours of sleep
                    </motion.p>
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-4">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6"
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl group transition-colors hover:bg-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Moon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bedtime</p>
                          <input 
                            type="time" 
                            value={sleepTime}
                            onChange={(e) => setSleepTime(e.target.value)}
                            className="text-xl font-bold bg-transparent outline-none text-[#1A1A1A]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl group transition-colors hover:bg-gray-100">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                          <Sun className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Wake up</p>
                          <input 
                            type="time" 
                            value={wakeTime}
                            onChange={(e) => setWakeTime(e.target.value)}
                            className="text-xl font-bold bg-transparent outline-none text-[#1A1A1A]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 pt-2">
                       <Bed className="w-5 h-5 text-gray-300" />
                       <span className="text-sm font-medium text-gray-500">Targeting optimal rest cycles</span>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col items-center mb-2 w-full max-w-sm mx-auto">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(11)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 11 && (
            <div className="h-full flex flex-col justify-between relative overflow-hidden bg-white">
              {/* Soft decorative elements for light theme */}
              <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-orange-50 rounded-full blur-[120px] pointer-events-none" />
              <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="flex-none p-8 pb-0 relative z-20">
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => paginate(10)}
                  className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl text-gray-500 hover:text-orange-600 transition-all duration-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Scrollable Content Container */}
              <div className="flex-1 overflow-y-auto px-8 py-4 space-y-8 relative z-10 scrollbar-hide">
                <div className="text-center space-y-3 px-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-orange-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100 shadow-sm"
                  >
                    <Utensils className="w-8 h-8 text-orange-600" />
                  </motion.div>
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold leading-tight text-[#1A1A1A] tracking-tight"
                  >
                    Your <br />
                    <span className="text-orange-600">meal times?</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 text-sm font-medium max-w-[250px] mx-auto"
                  >
                    Consistent timing helps metabolism and performance
                  </motion.p>
                </div>

                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Main Meals Section */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="space-y-3">
                      <div 
                        className={`bg-gray-50/50 p-5 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:bg-white transition-all duration-300 ${!showMorning ? 'opacity-50' : 'hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5'}`}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${!showMorning ? 'bg-gray-200 text-gray-400 border-gray-200' : 'bg-yellow-100 text-yellow-600 border-yellow-200/50 group-hover:scale-110'}`}>
                            <Coffee className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Morning</p>
                            <input 
                              type="time" 
                              value={morningTime}
                              disabled={!showMorning}
                              onChange={(e) => setMorningTime(e.target.value)}
                              className={`text-2xl font-bold bg-transparent outline-none w-full transition-all ${!showMorning ? 'text-gray-300 cursor-not-allowed' : 'text-[#1A1A1A] cursor-pointer hover:text-orange-600'}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Skip</span>
                            <button 
                              onClick={() => setShowMorning(!showMorning)}
                              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${!showMorning ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!showMorning ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`bg-gray-50/50 p-5 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:bg-white transition-all duration-300 ${!showLunch ? 'opacity-50' : 'hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5'}`}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${!showLunch ? 'bg-gray-200 text-gray-400 border-gray-200' : 'bg-orange-100 text-orange-600 border-orange-200/50 group-hover:scale-110'}`}>
                            <Utensils className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Lunch</p>
                            <input 
                              type="time" 
                              value={lunchTime}
                              disabled={!showLunch}
                              onChange={(e) => setLunchTime(e.target.value)}
                              className={`text-2xl font-bold bg-transparent outline-none w-full transition-all ${!showLunch ? 'text-gray-300 cursor-not-allowed' : 'text-[#1A1A1A] cursor-pointer hover:text-orange-600'}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Skip</span>
                            <button 
                              onClick={() => setShowLunch(!showLunch)}
                              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${!showLunch ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!showLunch ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`bg-gray-50/50 p-5 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:bg-white transition-all duration-300 ${!showDinner ? 'opacity-50' : 'hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5'}`}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-sm ${!showDinner ? 'bg-gray-200 text-gray-400 border-gray-200' : 'bg-indigo-100 text-indigo-600 border-indigo-200/50 group-hover:scale-110'}`}>
                            <Moon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Dinner</p>
                            <input 
                              type="time" 
                              value={dinnerTime}
                              disabled={!showDinner}
                              onChange={(e) => setDinnerTime(e.target.value)}
                              className={`text-2xl font-bold bg-transparent outline-none w-full transition-all ${!showDinner ? 'text-gray-300 cursor-not-allowed' : 'text-[#1A1A1A] cursor-pointer hover:text-orange-600'}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Skip</span>
                            <button 
                              onClick={() => setShowDinner(!showDinner)}
                              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${!showDinner ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!showDinner ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Workout Meals Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Workout Meal <span className="text-gray-400 font-normal lowercase">(optional)</span></h3>
                    </div>
                    <div className="space-y-3">
                      <div 
                        className={`bg-orange-50/30 p-5 rounded-[2.5rem] border border-orange-100/50 flex items-center justify-between group hover:bg-white transition-all duration-300 ${!showPreWorkout ? 'opacity-50' : 'hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5'}`}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${!showPreWorkout ? 'bg-gray-200 text-gray-400' : 'bg-orange-500 text-white shadow-lg shadow-orange-200 group-hover:scale-110'}`}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest leading-none mb-1.5">Pre-Workout</p>
                            <input 
                              type="time" 
                              value={preWorkoutTime}
                              disabled={!showPreWorkout}
                              onChange={(e) => setPreWorkoutTime(e.target.value)}
                              className={`text-2xl font-bold bg-transparent outline-none w-full transition-all ${!showPreWorkout ? 'text-gray-300 cursor-not-allowed' : 'text-[#1A1A1A] cursor-pointer hover:text-orange-600'}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Skip</span>
                            <button 
                              onClick={() => setShowPreWorkout(!showPreWorkout)}
                              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${!showPreWorkout ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!showPreWorkout ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`bg-green-50/30 p-5 rounded-[2.5rem] border border-green-100/50 flex items-center justify-between group hover:bg-white transition-all duration-300 ${!showPostWorkout ? 'opacity-50' : 'hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-0.5'}`}
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${!showPostWorkout ? 'bg-gray-200 text-gray-400' : 'bg-green-500 text-white shadow-lg shadow-green-200 group-hover:scale-110'}`}>
                            <Activity className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest leading-none mb-1.5">Post-Workout</p>
                            <input 
                              type="time" 
                              value={postWorkoutTime}
                              disabled={!showPostWorkout}
                              onChange={(e) => setPostWorkoutTime(e.target.value)}
                              className={`text-2xl font-bold bg-transparent outline-none w-full transition-all ${!showPostWorkout ? 'text-gray-300 cursor-not-allowed' : 'text-[#1A1A1A] cursor-pointer hover:text-orange-600'}`}
                            />
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">Skip</span>
                            <button 
                              onClick={() => setShowPostWorkout(!showPostWorkout)}
                              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${!showPostWorkout ? 'bg-orange-500' : 'bg-gray-200'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!showPostWorkout ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Snacks Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 mb-8">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Snacks <span className="text-gray-400 font-normal lowercase">(optional)</span></h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: 'morningSnack', label: 'Morning Snack', time: morningSnackTime, setTime: setMorningSnackTime, skip: showMorningSnack, setSkip: setShowMorningSnack, icon: Coffee, color: 'bg-yellow-100 text-yellow-600' },
                        { id: 'afternoonSnack', label: 'Afternoon Snack', time: afternoonSnackTime, setTime: setAfternoonSnackTime, skip: showAfternoonSnack, setSkip: setShowAfternoonSnack, icon: Apple, color: 'bg-orange-100 text-orange-600' },
                        { id: 'eveningSnack', label: 'Evening Snack', time: eveningSnackTime, setTime: setEveningSnackTime, skip: showEveningSnack, setSkip: setShowEveningSnack, icon: Sun, color: 'bg-indigo-100 text-indigo-600' },
                        { id: 'nightSnack', label: 'Night Snack', time: nightSnackTime, setTime: setNightSnackTime, skip: showNightSnack, setSkip: setShowNightSnack, icon: Moon, color: 'bg-slate-100 text-slate-600' },
                      ].map((snack) => (
                        <div 
                          key={snack.id} 
                          className={`bg-gray-50/30 p-5 rounded-[2.5rem] border border-gray-100 flex items-center justify-between group hover:bg-white transition-all duration-300 ${!snack.skip ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-center space-x-4 w-full">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${!snack.skip ? 'bg-gray-200 text-gray-400' : snack.color}`}>
                              <snack.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{snack.label}</p>
                              <input 
                                type="time" 
                                value={snack.time} 
                                disabled={!snack.skip}
                                onChange={(e) => snack.setTime(e.target.value)} 
                                className={`text-xl font-bold bg-transparent outline-none w-full transition-all ${!snack.skip ? 'text-gray-300 cursor-not-allowed' : 'text-[#1A1A1A] cursor-pointer'}`} 
                              />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Skip</span>
                              <button 
                                onClick={() => snack.setSkip(!snack.skip)}
                                className={`w-10 h-5 rounded-full transition-all duration-300 relative ${!snack.skip ? 'bg-orange-500' : 'bg-gray-200'}`}
                              >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${!snack.skip ? 'left-5.5' : 'left-0.5'}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-none p-8 pt-0 relative z-20 bg-gradient-to-t from-white via-white/80 to-transparent">
                <motion.button
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', damping: 20, delay: 0.4 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(12)}
                  className="group relative w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-[0_20px_40px_rgba(0,0,0,0.2)] overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span>Continue</span>
                  <Sparkles className="w-6 h-6 text-orange-500 group-hover:rotate-12 transition-all" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 12 && (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-none p-8 pt-12 pb-6">
                <div className="flex items-center justify-between mb-8">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => paginate(11)}
                    className="w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </motion.button>
                  <div className="bg-gray-100 h-1.5 w-24 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '92%' }}
                      className="h-full bg-[#1A1A1A] rounded-full"
                    />
                  </div>
                  <div className="w-12" />
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-2"
                >
                  <h2 className="text-4xl font-display font-bold tracking-tight">Dietary Preferences</h2>
                  <p className="text-gray-500 font-medium">Help us personalize your meal plans</p>
                </motion.div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 pb-32 scrollbar-hide">
                <div className="space-y-8">
                  {/* Diet Type */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Utensils className="w-4 h-4" />
                      diet type
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'no specific diet', label: 'No Diet', icon: Flame },
                        { id: 'vegan', label: 'Vegan', icon: Leaf },
                        { id: 'vegetarian', label: 'Vegetarian', icon: Apple },
                        { id: 'keto', label: 'Keto', icon: Beef },
                        { id: 'paleo', label: 'Paleo', icon: Flame },
                        { id: 'mediterranean', label: 'Med Diet', icon: Utensils },
                      ].map((item) => (
                        <motion.button
                          key={item.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setDietType(item.id)}
                          className={`p-4 rounded-3xl border-2 transition-all text-sm font-bold flex flex-col items-center gap-2 relative overflow-hidden ${
                            dietType === item.id 
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl shadow-gray-200' 
                              : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          <item.icon className={`w-6 h-6 ${dietType === item.id ? 'text-green-400' : 'text-gray-300'}`} />
                          <span className="truncate">{item.label}</span>
                          {dietType === item.id && (
                            <div className="absolute top-2 right-2">
                              <Check className="w-3 h-3 text-green-400" />
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">allergies & restrictions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {['No allergies', 'Gluten', 'Dairy', 'Nuts', 'Egg', 'Shellfish', 'Soy', 'Fish'].map((allergy) => (
                        <motion.button
                          key={allergy}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (allergy === 'No allergies') {
                              setAllergies([]);
                            } else {
                              setAllergies(prev => 
                                prev.includes(allergy) 
                                  ? prev.filter(a => a !== allergy) 
                                  : [...prev.filter(a => a !== 'No allergies'), allergy]
                              );
                            }
                          }}
                          className={`p-4 rounded-3xl border-2 transition-all text-sm font-bold flex items-center justify-between ${
                            (allergy === 'No allergies' && allergies.length === 0) || allergies.includes(allergy)
                              ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl shadow-gray-200' 
                              : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                          }`}
                        >
                          <span className="truncate">{allergy}</span>
                          {((allergy === 'No allergies' && allergies.length === 0) || allergies.includes(allergy)) && (
                            <Check className="w-4 h-4 flex-none" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Other Allergy */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">other allergy</h3>
                    <div className="relative">
                      <input 
                        type="text"
                        value={otherAllergy}
                        onChange={(e) => setOtherAllergy(e.target.value)}
                        placeholder="Type any other allergies..."
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-3xl p-5 outline-none focus:border-gray-200 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-none p-8 pt-0 bg-gradient-to-t from-white via-white/80 to-transparent relative z-20">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(13)}
                  className="w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6 text-orange-500" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 13 && (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-none px-8 pt-10 pb-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(12)}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all mb-6"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">Question 1 of 4</span>
                  </div>
                  
                  <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '25%' }}
                      className="absolute h-full bg-green-500 rounded-full"
                    />
                  </div>

                  {/* Decorative Colored Shape - Slightly more compact */}
                  <div className="flex justify-center py-2">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[1.5rem] shadow-xl shadow-green-200"
                    />
                  </div>

                  <h2 className="text-3xl font-display font-bold tracking-tight leading-[1.1]">How often do you eat out?</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="space-y-3 pb-32">
                  {[
                    { id: 'rarely', label: 'rarely', sub: '(1-2 times/month)', icon: Coffee },
                    { id: 'sometimes', label: 'sometimes', sub: '(1-2 times/week)', icon: Utensils },
                    { id: 'often', label: 'often', sub: '(3-4 times/week)', icon: Store },
                    { id: 'daily', label: 'Daily', sub: '(5+ times/week)', icon: Zap },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEatOutFrequency(option.id)}
                      className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative group overflow-hidden ${
                        eatOutFrequency === option.id 
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-2xl' 
                        : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className="relative z-10 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          eatOutFrequency === option.id 
                          ? 'bg-white/10 text-white' 
                          : 'bg-white text-gray-400 shadow-sm'
                        }`}>
                          <option.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold capitalize ${eatOutFrequency === option.id ? 'text-white' : 'text-[#1A1A1A]'}`}>
                              {option.label}
                            </span>
                            {eatOutFrequency === option.id && <Check className="w-5 h-5 text-green-400" />}
                          </div>
                          <p className={`text-xs font-medium ${eatOutFrequency === option.id ? 'text-gray-400' : 'text-gray-400'}`}>
                            {option.sub}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex-none p-8 pt-0 bg-gradient-to-t from-white via-white/80 to-transparent relative z-20 -mt-24">
                <motion.button
                  disabled={!eatOutFrequency}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={eatOutFrequency ? { scale: 1.02, translateY: -2 } : {}}
                  whileTap={eatOutFrequency ? { scale: 0.98 } : {}}
                  onClick={() => paginate(14)}
                  className={`w-full py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl transition-all duration-300 ${
                    eatOutFrequency 
                    ? 'bg-[#1A1A1A] text-white shadow-black/20' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className={`w-6 h-6 ${eatOutFrequency ? 'text-orange-500' : 'text-gray-300'}`} />
                </motion.button>
              </div>
            </div>
          )}

          {page === 14 && (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-none px-8 pt-10 pb-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(13)}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all mb-6"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full">Question 2 of 4</span>
                  </div>
                  
                  <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '50%' }}
                      className="absolute h-full bg-blue-500 rounded-full"
                    />
                  </div>

                  {/* Decorative Colored Shape */}
                  <div className="flex justify-center py-2">
                    <motion.div 
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full shadow-xl shadow-blue-200"
                    />
                  </div>

                  <h2 className="text-3xl font-display font-bold tracking-tight leading-[1.1]">Do you cook at home?</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="space-y-3 pb-32">
                  {[
                    { id: 'always', label: 'Always', sub: 'I love cooking', icon: ChefHat },
                    { id: 'often', label: 'Often', sub: 'Most meals', icon: Flame },
                    { id: 'sometimes', label: 'Sometimes', sub: 'When I can', icon: Utensils },
                    { id: 'rarely', label: 'Rarely', sub: 'Too busy', icon: Clock },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCookAtHomeFrequency(option.id)}
                      className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative group overflow-hidden ${
                        cookAtHomeFrequency === option.id 
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-2xl' 
                        : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className="relative z-10 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          cookAtHomeFrequency === option.id 
                          ? 'bg-white/10 text-white' 
                          : 'bg-white text-gray-400 shadow-sm'
                        }`}>
                          <option.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold capitalize ${cookAtHomeFrequency === option.id ? 'text-white' : 'text-[#1A1A1A]'}`}>
                              {option.label}
                            </span>
                            {cookAtHomeFrequency === option.id && <Check className="w-5 h-5 text-blue-400" />}
                          </div>
                          <p className={`text-xs font-medium ${cookAtHomeFrequency === option.id ? 'text-gray-400' : 'text-gray-400'}`}>
                            {option.sub}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex-none p-8 pt-0 bg-gradient-to-t from-white via-white/80 to-transparent relative z-20 -mt-20">
                <motion.button
                  disabled={!cookAtHomeFrequency}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={cookAtHomeFrequency ? { scale: 1.02, translateY: -2 } : {}}
                  whileTap={cookAtHomeFrequency ? { scale: 0.98 } : {}}
                  onClick={() => paginate(15)}
                  className={`w-full py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl transition-all duration-300 ${
                    cookAtHomeFrequency 
                    ? 'bg-[#1A1A1A] text-white shadow-black/20' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className={`w-6 h-6 ${cookAtHomeFrequency ? 'text-orange-500' : 'text-gray-300'}`} />
                </motion.button>
              </div>
            </div>
          )}

          {page === 15 && (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-none px-8 pt-10 pb-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(14)}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all mb-6"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-[10px] font-black uppercase tracking-widest rounded-full">Question 3 of 4</span>
                  </div>
                  
                  <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      className="absolute h-full bg-cyan-500 rounded-full"
                    />
                  </div>

                  {/* Decorative Colored Shape */}
                  <div className="flex justify-center py-2">
                    <motion.div 
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl shadow-xl shadow-cyan-200 flex items-center justify-center"
                    >
                      <Droplets className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-display font-bold tracking-tight leading-[1.1]">How much water do you drink?</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="space-y-3 pb-32">
                  {[
                    { id: 'high', label: 'high', sub: '(8+ glasses/day)', recommend: true },
                    { id: 'moderate', label: 'moderate', sub: '(4-7 glasses/day)' },
                    { id: 'low', label: 'low', sub: '(1-3 glasses/day)' },
                    { id: 'very_low', label: 'very low', sub: '(rarely drink water)' },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setWaterIntake(option.id)}
                      className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative group overflow-hidden ${
                        waterIntake === option.id 
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-2xl' 
                        : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold capitalize ${waterIntake === option.id ? 'text-white' : 'text-[#1A1A1A]'}`}>
                              {option.label}
                            </span>
                            {option.recommend && (
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${waterIntake === option.id ? 'bg-cyan-500 text-white' : 'bg-green-100 text-green-700'}`}>
                                Recommend
                              </span>
                            )}
                          </div>
                          {waterIntake === option.id && <Check className="w-5 h-5 text-cyan-400" />}
                        </div>
                        <p className={`text-xs font-medium ${waterIntake === option.id ? 'text-gray-400' : 'text-gray-400'}`}>
                          {option.sub}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex-none p-8 pt-0 bg-gradient-to-t from-white via-white/80 to-transparent relative z-20 -mt-24">
                <motion.button
                  disabled={!waterIntake}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={waterIntake ? { scale: 1.02, translateY: -2 } : {}}
                  whileTap={waterIntake ? { scale: 0.98 } : {}}
                  onClick={() => paginate(16)}
                  className={`w-full py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl transition-all duration-300 ${
                    waterIntake 
                    ? 'bg-[#1A1A1A] text-white shadow-black/20' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className={`w-6 h-6 ${waterIntake ? 'text-orange-500' : 'text-gray-300'}`} />
                </motion.button>
              </div>
            </div>
          )}

          {page === 16 && (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-none px-8 pt-10 pb-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(15)}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all mb-6"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest rounded-full">Question 4 of 4</span>
                  </div>
                  
                  <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      className="absolute h-full bg-purple-500 rounded-full"
                    />
                  </div>

                  {/* Decorative Colored Shape */}
                  <div className="flex justify-center py-2">
                    <motion.div 
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-16 h-16 bg-gradient-to-br from-purple-400 to-fuchsia-600 rounded-[1.5rem] shadow-xl shadow-purple-200 flex items-center justify-center"
                    >
                      <Brain className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-display font-bold tracking-tight leading-[1.1]">What is your biggest challenges?</h2>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Select all to apply</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="space-y-3 pb-32">
                  {[
                    { id: 'cravings', label: 'Sugar/ Junk food cravings', icon: Apple },
                    { id: 'time', label: 'Not enough time to cook', icon: Clock },
                    { id: 'motivation', label: 'Lack of motivation', icon: Zap },
                    { id: 'stress', label: 'Stress / emotional eating', icon: Heart },
                    { id: 'social', label: 'Social pressure', icon: Users },
                    { id: 'budget', label: 'Budget constraints', icon: Coins },
                  ].map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setChallenges(prev => 
                          prev.includes(option.label) 
                            ? prev.filter(c => c !== option.label)
                            : [...prev, option.label]
                        );
                      }}
                      className={`w-full p-5 rounded-[2rem] border-2 text-left transition-all duration-300 relative group overflow-hidden ${
                        challenges.includes(option.label)
                        ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-2xl' 
                        : 'border-gray-50 bg-gray-50/50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className="relative z-10 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          challenges.includes(option.label)
                          ? 'bg-white/10 text-white' 
                          : 'bg-white text-gray-400 shadow-sm'
                        }`}>
                          <option.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-base font-bold ${challenges.includes(option.label) ? 'text-white' : 'text-[#1A1A1A]'}`}>
                              {option.label}
                            </span>
                            {challenges.includes(option.label) && <Check className="w-5 h-5 text-purple-400" />}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex-none p-8 pt-0 bg-gradient-to-t from-white via-white/80 to-transparent relative z-20 -mt-24">
                <motion.button
                  disabled={challenges.length === 0}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={challenges.length > 0 ? { scale: 1.02, translateY: -2 } : {}}
                  whileTap={challenges.length > 0 ? { scale: 0.98 } : {}}
                  onClick={() => paginate(17)}
                  className={`w-full py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl transition-all duration-300 ${
                    challenges.length > 0
                    ? 'bg-[#1A1A1A] text-white shadow-black/20' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Finish Setup</span>
                  <Sparkles className={`w-6 h-6 ${challenges.length > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                </motion.button>
              </div>
            </div>
          )}

          {page === 17 && (
            <div className="h-full flex flex-col bg-white overflow-hidden">
              <div className="flex-none px-8 pt-10 pb-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => paginate(16)}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-50 transition-all mb-6"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-full">Step 2 of 2</span>
                  </div>
                  
                  <div className="relative h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: '50%' }}
                      animate={{ width: '100%' }}
                      className="absolute h-full bg-orange-500 rounded-full"
                    />
                  </div>

                  {/* Decorative Icon */}
                  <div className="flex justify-center py-2">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl shadow-xl shadow-orange-200 flex items-center justify-center"
                    >
                      <Clock className="w-8 h-8 text-white" />
                    </motion.div>
                  </div>

                  <h2 className="text-3xl font-display font-bold tracking-tight leading-[1.1]">Stay on track</h2>
                  <p className="text-gray-500 font-medium leading-relaxed">Stay motivated with your personal reminders</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-4">
                <div className="space-y-4 pb-32">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setReminders(prev => ({ ...prev, meals: !prev.meals }))}
                    className={`w-full p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                      reminders.meals 
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl' 
                      : 'border-gray-50 bg-gray-50/50 text-gray-500'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reminders.meals ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${reminders.meals ? 'text-white' : 'text-[#1A1A1A]'}`}>Meal Reminders</span>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${reminders.meals ? 'bg-orange-500' : 'bg-gray-200'}`}>
                          <motion.div 
                            animate={{ x: reminders.meals ? 16 : 0 }}
                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </div>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${reminders.meals ? 'text-gray-300' : 'text-gray-400'}`}>
                        Get reminded 2 hour after each meal (3x daily)
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setReminders(prev => ({ ...prev, report: !prev.report }))}
                    className={`w-full p-6 rounded-[2.5rem] border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                      reminders.report 
                      ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl' 
                      : 'border-gray-50 bg-gray-50/50 text-gray-500'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reminders.report ? 'bg-purple-500 text-white' : 'bg-white text-gray-400 shadow-sm'}`}>
                      <Activity className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${reminders.report ? 'text-white' : 'text-[#1A1A1A]'}`}>Daily Report</span>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${reminders.report ? 'bg-purple-500' : 'bg-gray-200'}`}>
                          <motion.div 
                            animate={{ x: reminders.report ? 16 : 0 }}
                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </div>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${reminders.report ? 'text-gray-300' : 'text-gray-400'}`}>
                        Daily Nutrition summary at 8 pm
                      </p>
                    </div>
                  </motion.button>
                </div>
              </div>

              <div className="flex-none p-8 pt-0 bg-gradient-to-t from-white via-white/80 to-transparent relative z-20 -mt-24">
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => paginate(18)}
                  className="w-full py-6 rounded-[2rem] bg-[#1A1A1A] text-white font-bold text-lg flex items-center justify-center space-x-3 shadow-2xl shadow-black/20"
                >
                  <span>Go to Dashboard</span>
                  <Sparkles className="w-6 h-6 text-orange-500" />
                </motion.button>
              </div>
            </div>
          )}

          {page === 18 && (
            <div className="h-full flex flex-col bg-white p-8 overflow-hidden">
              <div className="flex-1 flex flex-col items-center justify-center">
                {/* Visual Circle Loader - Keeping it for style but focusing on the bottom requirements */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative w-40 h-40 flex items-center justify-center"
                >
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#F3F4F6"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="#22C55E"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="440"
                      animate={{ strokeDashoffset: 440 - (440 * planProgress) / 100 }}
                      transition={{ duration: 0.3 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-green-500 animate-pulse" />
                  </div>
                </motion.div>
              </div>

              {/* Requirements: Headings at the bottom, then loading, then percentage */}
              <div className="flex-none space-y-8 pb-12">
                <div className="text-center space-y-2">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-4xl font-display font-bold tracking-tight text-[#1A1A1A]"
                  >
                    Creating your plan
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-500 font-medium leading-relaxed"
                  >
                    Creating your personality nutrition plan
                  </motion.p>
                </div>

                <div className="space-y-4">
                  {/* Loading Bar */}
                  <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                      animate={{ width: `${planProgress}%` }}
                    />
                  </div>
                  
                  {/* Percentage */}
                  <div className="text-center">
                    <span className="text-2xl font-display font-bold text-green-600">
                      {planProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === 19 && (
            <div className="h-full bg-gray-50/50 flex flex-col relative overflow-hidden">
              {/* Floating Background Elements */}
              <div className="absolute top-0 left-0 w-full h-64 bg-white rounded-b-[4rem] shadow-sm -z-10" />
              <div className="absolute top-20 right-[-10%] w-64 h-64 bg-green-100/30 rounded-full blur-3xl -z-10" />
              
              <div className="flex-1 overflow-y-auto px-6 pt-12 pb-32 scrollbar-hide space-y-8">
                {/* Header */}
                <header className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-display font-bold text-[#1A1A1A]">
                      Hey, {userMetadata?.displayName?.split(' ')[0] || currentUser?.displayName?.split(' ')[0] || 'Health Seeker'}!
                    </h2>
                    <div className="flex items-center gap-2 text-gray-500 font-medium bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-100 w-fit">
                      <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span className="text-sm">7-day perfect streak</span>
                    </div>
                  </div>
                </header>

                {/* Quick Actions Row */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => paginate(20)}
                    className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-green-100 transition-all group aspect-square"
                  >
                    <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-green-500 group-hover:text-white transition-colors">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-base leading-tight">AI Scan</h4>
                      <p className="text-[10px] text-gray-500 font-medium">Smart Detection</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setShowQuickAdd(true)}
                    className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center cursor-pointer hover:shadow-lg hover:border-blue-100 transition-all group aspect-square"
                  >
                    <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Plus className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-bold text-base leading-tight">Quick Add</h4>
                      <p className="text-[10px] text-gray-500 font-medium">Manual Log</p>
                    </div>
                  </motion.div>
                </div>

                {/* Main Progress Ring / Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileHover={{ y: -5 }}
                  className="relative bg-[#1A1A1A] text-white p-8 rounded-[3rem] shadow-2xl shadow-black/30 overflow-hidden group border border-white/5"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl" />
                  
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                      {/* CSS Progress Ring */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          className="text-white/10"
                        />
                        <motion.circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="12"
                          fill="transparent"
                          strokeDasharray="440"
                          initial={{ strokeDashoffset: 440 }}
                          animate={{ strokeDashoffset: 440 - (440 * 0.65) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className="text-green-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-display font-bold">1,240</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">kcal left</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 w-full gap-4 pt-4 border-t border-white/10 mt-2 text-center">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Goal</div>
                        <div className="font-bold">2,800</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Eaten</div>
                        <div className="font-bold text-green-500">1,560</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Exercise</div>
                        <div className="font-bold text-orange-400">320</div>
                      </div>
                    </div>

                    {/* Unified Macro Distribution Bar */}
                    <div className="w-full mt-6 space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
                        <span>Macro Distribution</span>
                        <span>Ratio 30:45:25</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full flex overflow-hidden backdrop-blur-sm border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '30%' }}
                          className="h-full bg-orange-500" 
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '45%' }}
                          className="h-full bg-blue-500" 
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '25%' }}
                          className="h-full bg-purple-500" 
                        />
                      </div>
                      <div className="flex justify-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="text-[9px] font-bold text-gray-400">Protein</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="text-[9px] font-bold text-gray-400">Carbs</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          <span className="text-[9px] font-bold text-gray-400">Fats</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Macro Distribution */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-2">
                    <h3 className="text-xl font-display font-bold">Nutrient Balance</h3>
                    <div className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-wider">Today's Split</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Protein', value: '82g', target: '125g', percent: 65, color: 'text-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', icon: Beef, advice: 'Lean meat, eggs, or lentils' },
                      { label: 'Carbs', value: '142g', target: '315g', percent: 45, color: 'text-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', icon: Apple, advice: 'Oats, rice, or sweet potato' },
                      { label: 'Fats', value: '44g', target: '145g', percent: 30, color: 'text-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', icon: Flame, advice: 'Avocado, nuts, or olive oil' },
                    ].map((macro) => (
                      <motion.div 
                        key={macro.label}
                        whileHover={{ y: -5 }}
                        className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group"
                      >
                        <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              className="text-gray-100"
                            />
                            <motion.circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray="176"
                              initial={{ strokeDashoffset: 176 }}
                              animate={{ strokeDashoffset: 176 - (176 * macro.percent / 100) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={macro.color}
                            />
                          </svg>
                          <div className={`absolute inset-0 flex items-center justify-center ${macro.text}`}>
                            <macro.icon className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute -top-1 -right-1 bg-white shadow-sm border border-gray-100 rounded-full w-6 h-6 flex items-center justify-center text-[8px] font-black">
                            {macro.percent}%
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">{macro.label}</div>
                          <div className="text-lg font-bold leading-tight">{macro.value}</div>
                          <div className="text-[10px] text-gray-400 font-medium">of {macro.target}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Smart Insight Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-2 p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Brain className="w-20 h-20 rotate-12" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                          <Sparkles className="w-4 h-4 text-yellow-300" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Smart Advice</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold leading-tight">Focus on Protein & Fiber</p>
                        <p className="text-xs text-white/70 font-medium leading-relaxed">
                          You've reached <span className="text-white font-bold">45%</span> of your daily carbs. For your next meal, prioritize lean protein to reach your goal.
                        </p>
                      </div>
                      <div className="pt-2 flex flex-wrap gap-2">
                        {['Chicken Breast', 'Quinoa', 'Greek Yogurt'].map((food) => (
                          <div key={food} className="bg-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                            + {food}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Water Tracker Integration */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-cyan-50 text-cyan-500 rounded-2xl flex items-center justify-center relative shadow-inner overflow-hidden">
                      <Droplets className="w-7 h-7 relative z-10" />
                      <motion.div 
                        animate={{ y: [40, 20, 30] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="absolute inset-0 bg-cyan-100 -z-0 opacity-50"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Hydro Track</h4>
                      <p className="text-xs text-gray-400 font-medium">6 of 10 glasses reached</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`w-2.5 h-8 rounded-full ${i <= 3 ? 'bg-cyan-500' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                </motion.div>

                {/* Selected Challenges / Focus Areas */}
                {(challenges?.length || 0) > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-display font-bold px-2">Focus Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {(challenges || []).map((challenge) => (
                        <span 
                          key={challenge}
                          className="px-4 py-2 bg-purple-50 text-purple-700 text-xs font-bold rounded-2xl border border-purple-100 shadow-sm"
                        >
                          {challenge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's Meals */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-xl font-display font-bold">Meal Log</h3>
                    <button className="text-green-600 font-bold text-sm flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors">
                      Log Detail <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { name: 'Morning Bowl', cal: 340, time: '8:30 AM', icon: Coffee, color: 'bg-orange-50 text-orange-600', items: 'Oatmeal, Berries', macros: { p: '12g', c: '45g', f: '6g' } },
                      { name: 'Lean Protein', cal: 520, time: '1:15 PM', icon: Utensils, color: 'bg-green-50 text-green-600', items: 'Chicken, Quinoa', macros: { p: '42g', c: '28g', f: '12g' } },
                    ].map((meal, i) => (
                      <motion.div 
                        key={meal.name}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        onClick={() => setExpandedMeal(expandedMeal === meal.name ? null : meal.name)}
                        className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer"
                      >
                        <div className="p-5 flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 ${meal.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                              <meal.icon className="w-7 h-7" />
                            </div>
                            <div>
                              <div className="font-bold text-lg">{meal.name}</div>
                              <div className="text-xs text-gray-400 font-medium">{meal.items} • {meal.time}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right pr-2">
                              <div className="text-xl font-display font-bold">+{meal.cal}</div>
                              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">Kcal</div>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedMeal === meal.name ? 180 : 0 }}
                            >
                              <ChevronRight className="w-5 h-5 text-gray-300" />
                            </motion.div>
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedMeal === meal.name && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-5 pb-5 pt-0"
                            >
                              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl">
                                <div className="text-center">
                                  <div className="text-xs font-black text-orange-500 uppercase">Protein</div>
                                  <div className="font-bold">{meal.macros.p}</div>
                                </div>
                                <div className="text-center border-x border-gray-200">
                                  <div className="text-xs font-black text-blue-500 uppercase">Carbs</div>
                                  <div className="font-bold">{meal.macros.c}</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-xs font-black text-purple-500 uppercase">Fats</div>
                                  <div className="font-bold">{meal.macros.f}</div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Add Modal */}
              <AnimatePresence>
                {showQuickAdd && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-md z-[100] flex items-end justify-center p-4"
                    onClick={() => setShowQuickAdd(false)}
                  >
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl space-y-8"
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-display font-bold">Manual Entry</h3>
                        <button 
                          onClick={() => setShowQuickAdd(false)}
                          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-4">Food Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Scrambled Eggs"
                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 font-bold"
                            value={manualEntry.name}
                            onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-4">Calories (Kcal)</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 font-display text-2xl font-bold"
                            value={manualEntry.cal}
                            onChange={(e) => setManualEntry({ ...manualEntry, cal: e.target.value })}
                          />
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowQuickAdd(false);
                          setManualEntry({ name: '', cal: '' });
                        }}
                        className="w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg shadow-xl"
                      >
                        Log Meal
                      </motion.button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Tab Bar */}
              <nav className="flex-none bg-white/80 backdrop-blur-xl border-t border-gray-100 px-8 py-6 flex justify-between items-center relative z-40">
                <div className="flex items-center justify-between w-full relative">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                      <Flame className="w-7 h-7" />
                    </div>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-gray-400">
                    <PieChart className="w-7 h-7" />
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    className="text-gray-400 cursor-pointer"
                    onClick={() => paginate(20)}
                  >
                    <Scan className="w-7 h-7" />
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    className="cursor-pointer"
                    onClick={() => setShowProfile(true)}
                  >
                    {userMetadata?.photoURL ? (
                      <div className="w-9 h-9 p-0.5 bg-white border border-gray-100 rounded-full overflow-hidden shadow-sm">
                        <img 
                          src={userMetadata.photoURL} 
                          alt="Profile" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <User className="w-7 h-7" />
                      </div>
                    )}
                  </motion.div>
                </div>
              </nav>

            </div>
          )}

          {page === 20 && (
            <div className="h-full bg-[#F8F9FA] flex flex-col relative overflow-hidden">
              {/* Header */}
              <div className="flex-none p-6 flex items-center justify-between z-50">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setPage(19);
                    setScanResult(null);
                    setCapturedImage(null);
                  }}
                  className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 text-gray-600"
                >
                  <ChevronLeft className="w-6 h-6" />
                </motion.button>
                <h2 className="text-xl font-display font-bold">Food Scanner</h2>
                <div className="w-12 h-12" /> {/* Spacer */}
              </div>

              <div className="flex-1 px-6 space-y-6 overflow-y-auto pb-32">
                {!capturedImage ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative w-full aspect-square rounded-[3rem] bg-[#1A1A1A] overflow-hidden shadow-2xl border-4 border-white"
                  >
                    {/* Simulated Camera Viewfinder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[80%] h-[80%] border-2 border-white/20 rounded-3xl border-dashed relative">
                         <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl" />
                         <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl" />
                         <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl" />
                         <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl" />
                      </div>
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white">
                        <Camera className="w-10 h-10" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-lg">Position food in center</p>
                        <p className="text-gray-400 text-sm">Tap button below to scan</p>
                      </div>
                    </div>

                    {/* Camera Capture Controls */}
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                       <label className="cursor-pointer">
                         <input 
                           type="file" 
                           accept="image/*" 
                           capture="environment" 
                           className="hidden" 
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onloadend = () => {
                                 const base64String = reader.result as string;
                                 setCapturedImage(base64String);
                                 analyzeFoodWithGemini(base64String);
                               };
                               reader.readAsDataURL(file);
                             }
                           }}
                         />
                         <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center border-8 border-white shadow-xl hover:scale-110 active:scale-95 transition-transform">
                           <Camera className="w-8 h-8 text-white" />
                         </div>
                       </label>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {/* Captured Image Preview */}
                    <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden shadow-xl border-4 border-white">
                      <img src={capturedImage} alt="Food" className="w-full h-full object-cover" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-4">
                          <div className="w-12 h-12 border-4 border-white/20 border-t-green-500 rounded-full animate-spin" />
                          <div className="text-center">
                            <p className="font-bold text-lg">Analyzing Food...</p>
                            <p className="text-gray-300 text-sm">Identifying nutrients & benefits</p>
                          </div>
                        </div>
                      )}
                      {!isAnalyzing && (
                        <button 
                          onClick={() => {
                            setCapturedImage(null);
                            setScanResult(null);
                          }}
                          className="absolute top-6 right-6 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      )}
                    </div>

                    {/* Scan Results */}
                    {scanResult && !isAnalyzing && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-2xl font-display font-bold text-green-600">{scanResult.foodName}</h3>
                              <div className="flex items-center gap-2 text-gray-500 font-medium">
                                <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-black uppercase text-gray-400">
                                  {scanResult.cuisineType}
                                </span>
                                <Activity className="w-4 h-4 ml-1" />
                                <span>Nutrition Breakdown</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="text-3xl font-display font-bold">{scanResult.nutrients?.calories}</div>
                              <div className="text-[10px] text-gray-400 font-black uppercase">Calories</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                             {[
                               { label: 'Prot.', val: scanResult.nutrients?.protein, color: 'bg-orange-100 text-orange-600' },
                               { label: 'Carbs', val: scanResult.nutrients?.carbs, color: 'bg-blue-100 text-blue-600' },
                               { label: 'Fats', val: scanResult.nutrients?.fats, color: 'bg-purple-100 text-purple-600' },
                               { label: 'Fiber', val: scanResult.nutrients?.fiber, color: 'bg-green-100 text-green-600' },
                             ].map((macro) => (
                               <div key={macro.label} className={`${macro.color} p-3 rounded-2xl text-center`}>
                                 <div className="text-sm font-bold">{macro.val}</div>
                                 <div className="text-[8px] font-black uppercase tracking-tighter">{macro.label}</div>
                               </div>
                             ))}
                          </div>

                          <div className="pt-4 border-t border-gray-50">
                             <div className="flex items-center justify-between mb-2">
                               <span className="text-sm font-bold text-gray-600">Health Score</span>
                               <span className="text-sm font-bold text-green-500">{scanResult.healthScore}%</span>
                             </div>
                             <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${scanResult.healthScore}%` }}
                                 className="h-full bg-green-500" 
                               />
                             </div>
                          </div>
                        </div>

                        {/* Advantages & Disadvantages */}
                        <div className="grid grid-cols-1 gap-4">
                           <div className="bg-green-50 p-6 rounded-[2.5rem] border border-green-100 space-y-4">
                              <div className="flex items-center gap-3 text-green-700 font-bold">
                                <Sparkles className="w-5 h-5" />
                                <h4>Advantages</h4>
                              </div>
                              <ul className="space-y-2">
                                {(scanResult.advantages || []).map((adv: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-sm text-green-700/80 font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-none" />
                                    {adv}
                                  </li>
                                ))}
                              </ul>
                           </div>

                           <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 space-y-4">
                              <div className="flex items-center gap-3 text-orange-700 font-bold">
                                <AlertCircle className="w-5 h-5" />
                                <h4>Disadvantages</h4>
                              </div>
                              <ul className="space-y-2">
                                {(scanResult.disadvantages || []).map((dis: string, i: number) => (
                                  <li key={i} className="flex gap-2 text-sm text-orange-700/80 font-medium leading-relaxed">
                                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-none" />
                                    {dis}
                                  </li>
                                ))}
                              </ul>
                           </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setPage(19);
                            setScanResult(null);
                            setCapturedImage(null);
                          }}
                          className="w-full bg-[#1A1A1A] text-white py-6 rounded-[2rem] font-bold text-lg flex items-center justify-center space-x-3 shadow-xl"
                        >
                          <span>Add to Daily Log</span>
                          <Check className="w-6 h-6 text-green-500" />
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Profile Sidebar (Global) */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm z-[150]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[85%] sm:w-[60%] lg:w-[50%] max-w-lg bg-white z-[160] shadow-2xl flex flex-col overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {showGoalSettings ? (
                  <motion.div 
                    key="goal-settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 flex-1 flex flex-col h-full bg-white transition-all"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => setShowGoalSettings(false)}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-400"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-2xl font-display font-bold">Goal Settings</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-10 pb-10 custom-scrollbar">
                      {/* Weekly Targets Section */}
                      <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase text-gray-400 tracking-[0.2em]">Weekly Targets</h3>
                          <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full">
                            {weeklyTargets.filter(t => t.completed).length}/{weeklyTargets.length} DONE
                          </div>
                        </div>

                        <div className="space-y-3">
                          {weeklyTargets.map((target) => (
                            <div 
                              key={target.id} 
                              className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all cursor-pointer ${target.completed ? 'bg-green-50 border-green-100 opacity-70' : 'bg-gray-50 border-transparent hover:border-gray-100'}`}
                              onClick={() => {
                                setWeeklyTargets(weeklyTargets.map(t => t.id === target.id ? { ...t, completed: !t.completed } : t));
                              }}
                            >
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${target.completed ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-100'}`}>
                                {target.completed && <Check className="w-4 h-4" />}
                              </div>
                              <span className={`text-sm font-bold flex-1 ${target.completed ? 'line-through text-gray-400' : 'text-[#1A1A1A]'}`}>
                                {target.text}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWeeklyTargets(weeklyTargets.filter(t => t.id !== target.id));
                                }}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            placeholder="Add new weekly target..."
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newTarget) {
                                setWeeklyTargets([...weeklyTargets, { id: Date.now(), text: newTarget, completed: false }]);
                                setNewTarget('');
                              }
                            }}
                            className="flex-1 bg-gray-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-green-500 outline-none text-sm font-bold"
                          />
                          <button 
                            onClick={() => {
                              if (newTarget) {
                                setWeeklyTargets([...weeklyTargets, { id: Date.now(), text: newTarget, completed: false }]);
                                setNewTarget('');
                              }
                            }}
                            className="p-4 bg-[#1A1A1A] text-white rounded-2xl hover:bg-black transition-colors"
                          >
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </section>

                      {/* Workout Plan Section */}
                      <section className="space-y-6 pt-6 border-t border-gray-100">
                        <h3 className="text-sm font-black uppercase text-gray-400 tracking-[0.2em]">Workout Plan</h3>
                        
                        <div className="space-y-3">
                          {workoutPlans.map((plan) => (
                            <div key={plan.id} className="p-5 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-gray-100 transition-all flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                                <Dumbbell className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-0.5">{plan.day}</div>
                                <div className="font-bold text-[#1A1A1A] truncate">{plan.exercise}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{plan.time}</div>
                              </div>
                              <button 
                                onClick={() => setWorkoutPlans(workoutPlans.filter(p => p.id !== plan.id))}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="bg-gray-50 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
                          <div className="grid grid-cols-2 gap-3">
                            <select 
                              value={newWorkoutDay}
                              onChange={(e) => setNewWorkoutDay(e.target.value)}
                              className="bg-white px-4 py-3 rounded-xl border-2 border-transparent focus:border-green-500 outline-none text-xs font-bold shadow-sm"
                            >
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <option key={day} value={day}>{day}</option>
                              ))}
                            </select>
                            <input 
                              type="text" 
                              placeholder="Time (e.g. 30 mins)"
                              value={newWorkoutTime}
                              onChange={(e) => setNewWorkoutTime(e.target.value)}
                              className="bg-white px-4 py-3 rounded-xl border-2 border-transparent focus:border-green-500 outline-none text-xs font-bold shadow-sm"
                            />
                          </div>
                          <div className="flex gap-3">
                            <input 
                              type="text" 
                              placeholder="Exercise name..."
                              value={newWorkoutExercise}
                              onChange={(e) => setNewWorkoutExercise(e.target.value)}
                              className="flex-1 bg-white px-6 py-4 rounded-2xl border-2 border-transparent focus:border-green-500 outline-none text-sm font-bold shadow-sm"
                            />
                            <button 
                              onClick={() => {
                                if (newWorkoutExercise) {
                                  setWorkoutPlans([...workoutPlans, { 
                                    id: Date.now(), 
                                    day: newWorkoutDay, 
                                    exercise: newWorkoutExercise, 
                                    time: newWorkoutTime || 'Flexible'
                                  }]);
                                  setNewWorkoutExercise('');
                                  setNewWorkoutTime('');
                                }
                              }}
                              className="px-6 bg-[#1A1A1A] text-white rounded-2xl hover:bg-black transition-colors font-bold text-sm"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  </motion.div>
                ) : showReminders ? (
                  <motion.div 
                    key="reminders"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 flex-1 flex flex-col h-full bg-white transition-all"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => setShowReminders(false)}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-400"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-2xl font-display font-bold">Reminders</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-10 custom-scrollbar">
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Daily Schedule</div>
                        {customRemindersList.map((reminder) => (
                          <div key={reminder.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-gray-100 transition-all">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reminder.active ? 'bg-green-50 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                                <Clock className="w-6 h-6" />
                              </div>
                                <div>
                                  {editingReminderId === reminder.id && editingField === 'type' ? (
                                    <input
                                      autoFocus
                                      type="text"
                                      value={reminder.type}
                                      onBlur={() => {
                                        setEditingReminderId(null);
                                        setEditingField(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setEditingReminderId(null);
                                          setEditingField(null);
                                        }
                                      }}
                                      onChange={(e) => {
                                        setCustomRemindersList(customRemindersList.map(r => 
                                          r.id === reminder.id ? { ...r, type: e.target.value } : r
                                        ));
                                      }}
                                      className="font-bold text-sm bg-white border border-gray-200 rounded px-1 outline-none w-full"
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => {
                                        setEditingReminderId(reminder.id);
                                        setEditingField('type');
                                      }}
                                      className="font-bold text-sm cursor-pointer hover:text-green-600 transition-colors"
                                    >
                                      {reminder.type}
                                    </div>
                                  )}

                                  {editingReminderId === reminder.id && editingField === 'time' ? (
                                    <input
                                      autoFocus
                                      type="time"
                                      value={reminder.time}
                                      onBlur={() => {
                                        setEditingReminderId(null);
                                        setEditingField(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          setEditingReminderId(null);
                                          setEditingField(null);
                                        }
                                      }}
                                      onChange={(e) => {
                                        setCustomRemindersList(customRemindersList.map(r => 
                                          r.id === reminder.id ? { ...r, time: e.target.value } : r
                                        ));
                                      }}
                                      className="text-xl font-display font-bold text-[#1A1A1A] bg-white border border-gray-200 rounded px-1 outline-none mt-1"
                                    />
                                  ) : (
                                    <div 
                                      onClick={() => {
                                        setEditingReminderId(reminder.id);
                                        setEditingField('time');
                                      }}
                                      className="text-xl font-display font-bold text-[#1A1A1A] cursor-pointer hover:text-green-600 transition-colors"
                                    >
                                      {reminder.time}
                                    </div>
                                  )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => {
                                  setCustomRemindersList(customRemindersList.map(r => r.id === reminder.id ? {...r, active: !r.active} : r));
                                }}
                                className={`w-12 h-6 rounded-full relative transition-colors ${reminder.active ? 'bg-green-500' : 'bg-gray-200'}`}
                              >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reminder.active ? 'right-1' : 'left-1'}`} />
                              </button>
                              <button 
                                onClick={() => setCustomRemindersList(customRemindersList.filter(r => r.id !== reminder.id))}
                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 bg-gray-50 rounded-[2rem] space-y-6">
                        <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Add New Reminder</div>
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {['Breakfast', 'Lunch', 'Dinner', 'Water', 'Workout'].map(t => (
                              <button
                                key={t}
                                onClick={() => setNewReminderType(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newReminderType === t ? 'bg-[#1A1A1A] text-white' : 'bg-white text-gray-400 border border-gray-100'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-4">
                            <input 
                              type="time" 
                              value={newReminderTime}
                              onChange={(e) => setNewReminderTime(e.target.value)}
                              className="flex-1 bg-white p-4 rounded-2xl border-2 border-transparent focus:border-green-500 outline-none font-bold shadow-sm"
                            />
                            <button 
                              onClick={() => {
                                if (newReminderTime) {
                                  setCustomRemindersList([...customRemindersList, { id: Date.now(), type: newReminderType, time: newReminderTime, active: true }]);
                                  setNewReminderTime('');
                                }
                              }}
                              className="bg-[#1A1A1A] text-white px-6 rounded-2xl font-bold hover:bg-black transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : showHowItWorks ? (
                  <motion.div 
                    key="how-it-works"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 flex-1 flex flex-col h-full bg-white transition-all"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => setShowHowItWorks(false)}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-400"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-2xl font-display font-bold">How it Works</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-10 pb-10 custom-scrollbar">
                      <div className="space-y-6">
                        {[
                          {
                            icon: Camera,
                            title: "Snapshot Analysis",
                            desc: "Snap a photo of your meal. Our Advanced AI identifies ingredients, estimates portions, and calculates precise nutritional data instantly.",
                            color: "bg-orange-50 text-orange-500"
                          },
                          {
                            icon: Activity,
                            title: "Smart Tracking",
                            desc: "Your data is automatically synced to your daily dashboard. We track calories, macros (Protein, Carbs, Fats), and sugar levels in real-time.",
                            color: "bg-blue-50 text-blue-500"
                          },
                          {
                            icon: Sparkles,
                            title: "Personalized Insights",
                            desc: "As you log more meals, the AI learns your habits and provides smarter suggestions to help you hit your weekly health goals.",
                            color: "bg-purple-50 text-purple-500"
                          },
                          {
                            icon: Target,
                            title: "Goal Completion",
                            desc: "Stay consistent and watch your metrics evolve. Whether it's weight management or heart health, we keep you on the right path.",
                            color: "bg-green-50 text-green-500"
                          }
                        ].map((step, idx) => (
                          <div key={idx} className="flex gap-5 group">
                            <div className="flex flex-col items-center">
                              <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center shrink-0`}>
                                <step.icon className="w-6 h-6" />
                              </div>
                              {idx !== 3 && <div className="w-0.5 h-full bg-gray-100 my-2" />}
                            </div>
                            <div className="pt-1">
                              <h3 className="text-base font-bold text-[#1A1A1A] mb-2">{step.title}</h3>
                              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </motion.div>
                ) : showPrivacyPolicy ? (
                  <motion.div 
                    key="privacy-policy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 flex-1 flex flex-col h-full bg-white transition-all"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => setShowPrivacyPolicy(false)}
                        className="p-3 bg-gray-50 rounded-2xl text-gray-400"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-2xl font-display font-bold">Privacy Policy</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-10 custom-scrollbar">
                      <section className="space-y-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                          <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Data Protection</h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                          Your health journey is personal. We use industry-standard encryption to protect your data. All meal submissions, metrics, and profile details are stored securely in our encrypted database.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">What we collect</h3>
                        <div className="space-y-3">
                          {[
                            'Health metrics (age, weight, height)',
                            'Meal photos and nutritional logs',
                            'Dietary preferences and goals',
                            'Activity and sleep patterns'
                          ].map(item => (
                            <div key={item} className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">How we use it</h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                          Your information is used strictly to provide personalized nutritional analysis, track your progress toward goals, and generate smarter recommendations for your specific lifestyle.
                        </p>
                      </section>

                      <section className="space-y-4">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Your Rights</h3>
                        <p className="text-gray-500 leading-relaxed text-sm">
                          You maintain full control over your data. You can update your information at any time via the Edit Profile section. Should you choose to delete your account, all personal health records will be permanently removed from our systems.
                        </p>
                      </section>
                    </div>

                    <div className="pt-6 border-t border-gray-100 mt-auto">
                      <p className="text-[10px] text-center text-gray-400 font-medium">
                        Last Updated: May 2024 • Version 1.2.0
                      </p>
                    </div>
                  </motion.div>
                ) : showEditProfile ? (
                  <motion.div 
                    key="edit-profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 flex-1 flex flex-col h-full bg-gray-50/30"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button 
                        onClick={() => setShowEditProfile(false)}
                        className="p-3 bg-white shadow-sm rounded-2xl text-gray-400"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <h2 className="text-2xl font-display font-bold">Edit Profile</h2>
                    </div>

                    <div className="space-y-8 flex-1">
                      {/* Photo Edit */}
                      <div className="flex flex-col items-center gap-4">
                        <div 
                          className="relative group cursor-pointer"
                          onClick={() => document.getElementById('profile-upload')?.click()}
                        >
                          <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl border-4 border-white overflow-hidden transition-transform group-hover:scale-[1.02]">
                            {editedPhotoURL ? (
                              <img src={editedPhotoURL} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-12 h-12 text-gray-100" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-[#1A1A1A] p-3 rounded-2xl shadow-lg border-2 border-white text-white">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                        <input 
                          id="profile-upload"
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const img = new Image();
                                img.onload = () => {
                                  // Create canvas for compression
                                  const canvas = document.createElement('canvas');
                                  let width = img.width;
                                  let height = img.height;
                                  
                                  // Max dimensions
                                  const MAX_SIZE = 800;
                                  if (width > height) {
                                    if (width > MAX_SIZE) {
                                      height *= MAX_SIZE / width;
                                      width = MAX_SIZE;
                                    }
                                  } else {
                                    if (height > MAX_SIZE) {
                                      width *= MAX_SIZE / height;
                                      height = MAX_SIZE;
                                    }
                                  }
                                  
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  ctx?.drawImage(img, 0, 0, width, height);
                                  
                                  // Compress to JPEG with 0.7 quality
                                  const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                                  setEditedPhotoURL(compressedBase64);
                                };
                                img.src = reader.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tap to change photo</p>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Display Name</label>
                          <input 
                            type="text" 
                            value={editedDisplayName}
                            onChange={(e) => setEditedDisplayName(e.target.value)}
                            placeholder="Your Name"
                            className="w-full bg-white p-5 rounded-[2rem] border-2 border-transparent focus:border-green-500 outline-none font-bold text-lg shadow-sm transition-all text-[#1A1A1A]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-4">Photo URL</label>
                          <input 
                            type="text" 
                            value={editedPhotoURL}
                            onChange={(e) => setEditedPhotoURL(e.target.value)}
                            placeholder="https://images..."
                            className="w-full bg-white p-5 rounded-[2rem] border-2 border-transparent focus:border-green-500 outline-none font-bold text-lg shadow-sm transition-all text-[#1A1A1A]"
                          />
                          <p className="text-[10px] text-gray-400 italic ml-4">Tip: try seeds like 'Felix', 'Aidan', or 'Aneka'</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdateProfile}
                        disabled={isUpdatingProfile}
                        className="w-full bg-green-500 text-white py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-green-100 disabled:opacity-50"
                      >
                        {isUpdatingProfile ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                        <span>{isUpdatingProfile ? 'Updating...' : 'Save Changes'}</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="view-profile"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex-1 flex flex-col h-full"
                  >
                    <div className="p-8 flex-1 overflow-y-auto">
                      <div className="flex justify-between items-center mb-12">
                        <h2 className="text-3xl font-display font-bold">Profile</h2>
                        <button 
                          onClick={() => setShowProfile(false)}
                          className="p-3 bg-gray-50 rounded-full text-gray-400"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-10">
                        {/* User Info Header */}
                        <div className="flex items-center gap-5">
                          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-lg border border-gray-100 overflow-hidden group">
                            {userMetadata?.photoURL ? (
                              <img 
                                src={userMetadata.photoURL} 
                                alt="Profile" 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10 text-gray-200" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-2xl truncate max-w-[200px]">
                              {userMetadata?.displayName || auth.currentUser?.email?.split('@')[0]}
                            </div>
                            <div className="text-sm text-gray-400 font-medium font-mono">
                              {auth.currentUser?.email}
                            </div>
                          </div>
                        </div>

                        {/* Settings List */}
                        <div className="space-y-4">
                          <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Account Settings</div>
                          {[
                            { icon: User, label: 'Edit Profile', desc: 'Personal metrics', onClick: () => {
                              setEditedDisplayName(userMetadata?.displayName || '');
                              setEditedPhotoURL(userMetadata?.photoURL || '');
                              setShowEditProfile(true);
                            }},
                            { icon: Activity, label: 'Goal Settings', desc: 'Weekly targets', onClick: () => setShowGoalSettings(true) },
                            { icon: Clock, label: 'Reminders', desc: 'Mealtimes & reports', onClick: () => setShowReminders(true) },
                            { icon: Heart, label: 'Subscription', desc: 'AI Pro Plan' },
                          ].map((item) => (
                            <div 
                              key={item.label} 
                              onClick={item.onClick}
                              className="group flex items-center justify-between p-4 bg-gray-50 rounded-3xl cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-green-500 transition-colors">
                                  <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-sm">{item.label}</div>
                                  <div className="text-[10px] text-gray-400 font-medium">{item.desc}</div>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          <div className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Support & More</div>
                          {[
                            { icon: Info, label: 'Privacy Policy', onClick: () => setShowPrivacyPolicy(true) },
                            { icon: Target, label: 'How it works', onClick: () => setShowHowItWorks(true) },
                          ].map((item) => (
                            <div 
                              key={item.label} 
                              onClick={item.onClick}
                              className="flex items-center justify-between p-4 text-gray-500 font-bold text-sm cursor-pointer hover:text-gray-900 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Logout Section */}
                    <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          handleSignOut();
                          setShowProfile(false);
                        }}
                        className="w-full bg-[#1A1A1A] text-white py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl"
                      >
                        <Zap className="w-5 h-5 text-green-400 fill-green-400" />
                        <span>Logout Account</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
