import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VoiceRecorder({ onTranscription, onAudioFile, buttonText = "🎤 Indtal beskrivelse" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsProcessing(true);
        
        try {
          // Upload lydfilen
          const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
          const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
          
          // Hvis der er en callback til at gemme lydfilen, brug den
          if (onAudioFile) {
            onAudioFile(file_url);
          }
          
          // Transcriber lyden til tekst hvis der er en transcription callback
          if (onTranscription) {
            const response = await base44.integrations.Core.InvokeLLM({
              prompt: "Transcriber denne lydoptagelse til dansk tekst. Returner kun den transcriberede tekst uden ekstra formatering.",
              file_urls: [file_url]
            });
            
            onTranscription(response);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          alert('Der skete en fejl ved behandling af lydoptagelsen');
        } finally {
          setIsProcessing(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Kunne ikke få adgang til mikrofon');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className="w-full h-14 text-lg rounded-xl border-2 border-dashed"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            Behandler...
          </>
        ) : isRecording ? (
          <>
            <Square className="w-5 h-5 mr-2 text-red-500" />
            Stop optagelse
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            {buttonText}
          </>
        )}
      </Button>
      
      {isRecording && (
        <div className="mt-2 flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75" />
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150" />
        </div>
      )}
    </div>
  );
}