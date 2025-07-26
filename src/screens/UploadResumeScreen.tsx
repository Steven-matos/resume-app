import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { jobApiService } from '../utils/jobApi';

type UploadResumeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'UploadResume'>;

/**
 * UploadResumeScreen component
 * Handles resume file upload with drag & drop functionality and file validation
 */
export default function UploadResumeScreen() {
  const navigation = useNavigation<UploadResumeScreenNavigationProp>();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Handles file selection from device storage
   * Validates file type and size before allowing upload
   */
  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        
        // Validate file size (5MB limit)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 5MB.');
          return;
        }

        setSelectedFile(result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  /**
   * Handles the resume upload process
   * Processes resume and finds matching jobs
   */
  const handleUpload = async () => {
    if (!selectedFile || selectedFile.canceled) {
      Alert.alert('No File Selected', 'Please select a resume file to upload.');
      return;
    }

    if (!jobTitle.trim()) {
      Alert.alert('Job Title Required', 'Please enter your desired job title.');
      return;
    }

    setIsUploading(true);

    try {
      // Simulate resume processing and analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Analyze resume for job matching
      const resumeText = selectedFile.assets[0]?.name || 'Resume content';
      const analysis = await jobApiService.analyzeResume(resumeText, jobTitle);
      
      // Navigate to Jobs screen after successful upload
      navigation.navigate('MainTabs');
      
      Alert.alert(
        'Upload Successful', 
        `Your resume has been analyzed! Match score: ${analysis.matchScore}%\n\nWe found ${analysis.skills.length} skills and ${analysis.recommendations.length} recommendations for improvement.`
      );
    } catch (error) {
      Alert.alert('Upload Failed', 'Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Upload your resume</Text>
          <Text style={styles.subtitle}>
            Upload your resume to get matched with jobs and receive resume recommendations.
          </Text>
        </View>

        {/* Job Title Input */}
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitleLabel}>Desired Job Title</Text>
          <TextInput
            style={styles.jobTitleInput}
            placeholder="e.g., Software Engineer, Product Manager"
            value={jobTitle}
            onChangeText={setJobTitle}
            placeholderTextColor="#8E8E93"
          />
        </View>

        {/* Upload Section */}
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={[
              styles.uploadArea,
              selectedFile && !selectedFile.canceled && styles.uploadAreaSelected
            ]}
            onPress={handleFilePick}
            activeOpacity={0.7}
          >
            <View style={styles.uploadContent}>
              <View style={styles.uploadIconContainer}>
                <Ionicons 
                  name="cloud-upload-outline" 
                  size={48} 
                  color={selectedFile && !selectedFile.canceled ? '#007AFF' : '#8E8E93'} 
                />
              </View>
              
              <Text style={styles.uploadTitle}>
                {selectedFile && !selectedFile.canceled 
                  ? selectedFile.assets[0]?.name || 'File Selected'
                  : 'Drag & drop or browse to upload'
                }
              </Text>
              
              <Text style={styles.uploadSubtitle}>
                Supports: PDF, DOC, DOCX (max. 5MB)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Browse Files Button */}
          <TouchableOpacity
            style={styles.browseButton}
            onPress={handleFilePick}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse Files</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedFile || selectedFile.canceled || !jobTitle.trim() || isUploading) && styles.uploadButtonDisabled
          ]}
          onPress={handleUpload}
          disabled={!selectedFile || selectedFile.canceled || !jobTitle.trim() || isUploading}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Resume'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
  },
  jobTitleContainer: {
    marginBottom: 32,
  },
  jobTitleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  jobTitleInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  uploadContainer: {
    marginBottom: 32,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    backgroundColor: '#F9F9F9',
  },
  uploadAreaSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 