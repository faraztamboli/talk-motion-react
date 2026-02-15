# Remotepy Functions Usage Analysis

## ✅ USED FUNCTIONS

### SessionServer Functions (7/12 used)
1. ✅ `SessionServer.getNewSessionId` - Used in `useLogin.js`
2. ✅ `SessionServer.validateLogin` - Used in `useLogin.js`
3. ✅ `SessionServer.isLoggedIn` - Used in `useAuthStatus.js`
4. ✅ `SessionServer.startSessionIfNotStarted` - Used in `useAuthStatus.js`
5. ✅ `SessionServer.registerLoginShort` - Used in `useSignup.js`
6. ✅ `SessionServer.logOut` - Used in `data/userMenuList.jsx`
7. ✅ `SessionServer.forgotPassword` - Used in `useForgotPassword.js`
8. ✅ `SessionServer.resetPassword` - Used in `useResetPassword.js`

### TalkMotionServer Functions (52/100+ used)

#### Model Management (18 functions)
1. ✅ `TalkMotionServer.loadModel2` - Used in `components/ui/ModelsDropdown.jsx`
2. ✅ `TalkMotionServer.getPublicModels` - Used in `hooks/useModels.js`
3. ✅ `TalkMotionServer.getUsersModels` - Used in `hooks/useModels.js`
4. ✅ `TalkMotionServer.getUsersModelsByUserName` - Used in `hooks/useModels.js`
5. ✅ `TalkMotionServer.createModel` - Used in `hooks/useModels.js`
6. ✅ `TalkMotionServer.updateModel` - Used in `hooks/useModels.js`
7. ✅ `TalkMotionServer.deleteModel` - Used in `hooks/useModels.js`
8. ✅ `TalkMotionServer.cloneModel` - Used in `hooks/useModels.js`
9. ✅ `TalkMotionServer.getModel` - Used in `hooks/useModels.js`
10. ✅ `TalkMotionServer.getModelFiles` - Used in `hooks/useModels.js`
11. ✅ `TalkMotionServer.getModelConcepts` - Used in `hooks/useModels.js`
12. ✅ `TalkMotionServer.getModelVideos` - Used in `hooks/useModels.js`
13. ✅ `TalkMotionServer.getConceptDetails` - Used in `hooks/useModels.js`
14. ✅ `TalkMotionServer.deleteModelConcepts` - Used in `hooks/useModels.js`
15. ✅ `TalkMotionServer.deleteModelConceptSample` - Used in `hooks/useModels.js`
16. ✅ `TalkMotionServer.getModelsUserCanTrain` - Used in `hooks/useModels.js`
17. ✅ `TalkMotionServer.getModelsUserCanUse` - Used in `hooks/useModels.js`
18. ✅ `TalkMotionServer.addTrainerToModel` - Used in `hooks/useModels.js`

#### Training & Collection (4 functions)
19. ✅ `TalkMotionServer.collectGestureAndConcept2` - Used in `hooks/useHolisticModel.js`
20. ✅ `TalkMotionServer.train2` - Used in `hooks/useTrainModel.js`
21. ✅ `TalkMotionServer.getTotalNumberOfLogMessages` - Used in `hooks/useTrainModel.js`
22. ✅ `TalkMotionServer.translateGestureToWords2` - Used in `hooks/useHolisticModel.js`

#### Translation (1 function)
23. ✅ `TalkMotionServer.translateWordsToGestures` - Used in `hooks/useVoiceToGesture.js`

#### Video Upload (2 functions)
24. ✅ `TalkMotionServer.uploadGestureVideo` - Used in `hooks/useUploadGestureVideo.js`
25. ✅ `TalkMotionServer.addWordToVideoURLMapping` - Used in `hooks/useUploadGestureVideo.js`

#### Video Recordings/Subtitles (7 functions)
26. ✅ `TalkMotionServer.createVideoRecording` - Used in `hooks/video_subtitles/useSlSubtitleDesigner.js`
27. ✅ `TalkMotionServer.updateVideoRecording` - Used in `hooks/video_subtitles/useSlSubtitleDesigner.js`
28. ✅ `TalkMotionServer.openVideoRecordingShot` - Used in `hooks/video_subtitles/useSlSubtitleDesigner.js`
29. ✅ `TalkMotionServer.closeVideoRecordingShotWithVideo` - Used in `hooks/video_subtitles/useSlSubtitleDesigner.js`
30. ✅ `TalkMotionServer.getVideoRecording` - Used in `hooks/video_subtitles/useSlSubtitles.js`
31. ✅ `TalkMotionServer.getPublicVideoRecordings` - Used in `hooks/useSubtitleVideos.js`
32. ✅ `TalkMotionServer.getVideoRecordingsICanUse` - Used in `hooks/useSubtitleVideos.js`
33. ✅ `TalkMotionServer.updateVideoRecordingPrivacy` - Used in `hooks/useSubtitleVideos.js`
34. ✅ `TalkMotionServer.deleteVideoRecording` - Used in `hooks/useSubtitleVideos.js`

#### Folders/Courses (11 functions)
34. ✅ `TalkMotionServer.saveFolder` - Used in `hooks/useFolders.js`
35. ✅ `TalkMotionServer.getChildFolders` - Used in `hooks/useFolders.js`
36. ✅ `TalkMotionServer.saveFolderContent` - Used in `hooks/useFolders.js`
37. ✅ `TalkMotionServer.getFolderContent` - Used in `hooks/useFolders.js`
38. ✅ `TalkMotionServer.copyFolder` - Used in `hooks/useFolders.js`
39. ✅ `TalkMotionServer.moveFolder` - Used in `hooks/useFolders.js`
40. ✅ `TalkMotionServer.getFolderAndContentsAndPermissions` - Used in `hooks/useFolders.js`
41. ✅ `TalkMotionServer.createFolderPermission` - Used in `hooks/useFolders.js`
42. ✅ `TalkMotionServer.getFolderPermissions` - Used in `hooks/useFolders.js`
43. ✅ `TalkMotionServer.deleteFolderPermission` - Used in `hooks/useFolders.js`
44. ✅ `TalkMotionServer.removeFolderContent` - Used in `hooks/useFolders.js`

#### Classrooms (8 functions)
45. ✅ `TalkMotionServer.getStaffsClassrooms` - Used in `hooks/useClassrooms.js`
46. ✅ `TalkMotionServer.getStudentsClassrooms` - Used in `hooks/useClassrooms.js`
47. ✅ `TalkMotionServer.createClassroom` - Used in `hooks/useClassrooms.js`
48. ✅ `TalkMotionServer.updateClassroom` - Used in `hooks/useClassrooms.js`
49. ✅ `TalkMotionServer.addStudentToClass` - Used in `hooks/useClassrooms.js`
50. ✅ `TalkMotionServer.addTeacherToClass` - Used in `hooks/useClassrooms.js`
51. ✅ `TalkMotionServer.removeStudentFromClass` - Used in `hooks/useClassrooms.js`
52. ✅ `TalkMotionServer.removeTeacherFromClass` - Used in `hooks/useClassrooms.js`
53. ✅ `TalkMotionServer.getClassStudents` - Used in `hooks/useClassrooms.js`
54. ✅ `TalkMotionServer.getClassTeachers` - Used in `hooks/useClassrooms.js`

#### Payment & E-commerce (8 functions)
55. ✅ `TalkMotionServer.getSupportedPaymentCurrencies` - Used in `hooks/usePayment.js`
56. ✅ `TalkMotionServer.getCart` - Used in `hooks/usePayment.js`
57. ✅ `TalkMotionServer.purchaseCart` - Used in `hooks/usePayment.js`
58. ✅ `TalkMotionServer.confirmPurchase` - Used in `hooks/usePayment.js`
59. ✅ `TalkMotionServer.addOrRemoveCartProduct` - Used in `hooks/useModels.js`
60. ✅ `TalkMotionServer.setCartProductQuantity` - Used in `hooks/useModels.js`
61. ✅ `TalkMotionServer.getProductForFree` - Used in `hooks/useModels.js` and `useSignup.js`
62. ✅ `TalkMotionServer.purchaseModel` - Used in `hooks/useModels.js`
63. ✅ `TalkMotionServer.setModelPrice` - Used in `hooks/useModels.js`
64. ✅ `TalkMotionServer.setProductPrice` - Used in `hooks/useModels.js`

#### Subscriptions (4 functions)
65. ✅ `TalkMotionServer.getPurchaseList` - Used in `hooks/useMySubscriptions.js`
66. ✅ `TalkMotionServer.cancelSubscription` - Used in `hooks/useMySubscriptions.js`
67. ✅ `TalkMotionServer.cancelProductSubscription` - Used in `hooks/useMySubscriptions.js`
68. ✅ `TalkMotionServer.cancelSubscriptionItem` - Used in `hooks/useMySubscriptions.js`

#### User Profile (3 functions)
69. ✅ `TalkMotionServer.getUserProfileNew` - Used in `hooks/useProfile.js`
70. ✅ `TalkMotionServer.updateUserProfileWithImages` - Used in `hooks/useProfile.js`
71. ✅ `TalkMotionServer.getUserInfo` - Used in `hooks/useProfile.js`
72. ✅ `TalkMotionServer.uploadProfilePicture` - Used in `hooks/useProfile.js`


---

## ❌ UNUSED FUNCTIONS

### SessionServer Functions (4 unused)
1. ❌ `SessionServer.checkIfUsernameExists`
2. ❌ `SessionServer.getSessionId`
3. ❌ `SessionServer.getUserProfile` (Note: `getUserProfileNew` is used instead)
4. ❌ `SessionServer.registerLogin` (Note: `registerLoginShort` is used instead)
5. ❌ `SessionServer.updateUserProfile` (Note: `updateUserProfileWithImages` is used instead)

### TalkMotionServer Functions (50+ unused)

#### Model Management (3 unused)
1. ❌ `TalkMotionServer.addMemberModel`
2. ❌ `TalkMotionServer.getModelFeatures`
3. ❌ `TalkMotionServer.getModelStats`
4. ❌ `TalkMotionServer.saveModelFeatureWeight`

#### Training & Collection (2 unused)
5. ❌ `TalkMotionServer.collectGetstureAndConcept` (Note: `collectGestureAndConcept2` is used, and `collect_gesture_and_concept` in useLeapMotion)
6. ❌ `TalkMotionServer.translateGestureToWords` (Note: `translateGestureToWords2` is used, and `translateGesturesToWords` in useLeapMotion)
7. ❌ `TalkMotionServer.loadModel` (Note: `loadModel2` is used instead)
8. ❌ `TalkMotionServer.train` (Note: `train2` is used, though `train` is in useLeapMotion)

#### Video Recordings (2 unused)
9. ❌ `TalkMotionServer.getVideoRecordings`
10. ❌ `TalkMotionServer.getUsersVideoRecordings`

#### Payment & E-commerce (5 unused)
11. ❌ `TalkMotionServer.clearCart`
12. ❌ `TalkMotionServer.purchaseCartOld` (Note: `purchaseCart` is used)
13. ❌ `TalkMotionServer.purchaseProduct`
14. ❌ `TalkMotionServer.getPurchaseDetail`
15. ❌ `TalkMotionServer.getUsersProducts`

#### Classrooms (4 unused)
16. ❌ `TalkMotionServer.requestClassroomAccessAsStudent`
17. ❌ `TalkMotionServer.requestClassroomAccessAsTeacher`
18. ❌ `TalkMotionServer.approveStudentRequestToClass`
19. ❌ `TalkMotionServer.approveTeacherRequestToClass`

#### Utility Functions (10+ unused)
20. ❌ `TalkMotionServer.addContactUsMessage`
21. ❌ `TalkMotionServer.languagesSupported`
22. ❌ `TalkMotionServer.wordSeparator`
23. ❌ `TalkMotionServer.getSubscriptions` (Note: `getPurchaseList` is used for subscriptions)

#### System Functions (2 unused)
24. ❌ `getPythonFunctionLibrary`
25. ❌ `getPythonFunctionLibraryHelp`

---

## 📊 SUMMARY

- **Total Functions Available**: ~112 functions
- **Functions Used**: ~75 functions (67%)
- **Functions Unused**: ~37 functions (33%)

### By Category:
- **SessionServer**: 8/12 used (67%)
- **Model Management**: 18/22 used (82%)
- **Training**: 4/6 used (67%)
- **Video/Subtitles**: 9/11 used (82%)
- **Folders**: 11/11 used (100%)
- **Classrooms**: 10/14 used (71%)
- **Payment**: 10/15 used (67%)
- **User Profile**: 4/4 used (100%)

---

## 🔍 NOTES

3. **Unused but Potentially Useful**:
   - `getModelFeatures` and `getModelStats` - Could be useful for model analytics
   - `getPurchaseDetail` - Could enhance purchase history UI
   - Classroom request/approval functions - Could enable classroom access requests
   - `languagesSupported` - Could be useful for internationalization
   - `wordSeparator` - Could be useful for text processing

4. **Missing Implementations**: Some features in the UI might benefit from unused functions:
   - Contact Us form could use `addContactUsMessage`
   - Model analytics could use `getModelStats` and `getModelFeatures`
   - Classroom access requests could use the request/approval functions

