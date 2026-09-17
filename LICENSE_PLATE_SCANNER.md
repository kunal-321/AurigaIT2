# License Plate Scanner - OCR Integration

## Overview

The ParkDesk parking management system now includes a camera-based license plate scanner using **Tesseract.js** for OCR (Optical Character Recognition). This feature allows attendants to quickly scan vehicle license plates instead of manually typing them, improving efficiency and reducing errors.

## Features

### 🎯 Core Functionality
- **Real-time camera capture** using device camera (front/back)
- **OCR processing** with Tesseract.js engine
- **Indian license plate pattern recognition** (MH12AB1234 format)
- **Confidence threshold filtering** (60% minimum confidence)
- **Automatic form pre-fill** when plate is detected
- **Manual entry fallback** when scanning fails
- **Visual scanning interface** with animated overlay

### 📱 User Experience
- One-click scanner activation
- Live camera preview with scanning frame
- Real-time processing indicator
- Success toast notification with confidence score
- Tips for better recognition
- Graceful error handling for camera permissions

## Technical Implementation

### Architecture

```
CheckIn Component
    ↓
User clicks "Scan" button
    ↓
LicensePlateScanner opens
    ↓
Camera stream starts (getUserMedia)
    ↓
Frame capture loop (every 1.5s)
    ↓
Tesseract.js OCR processing
    ↓
Pattern matching (Indian plate format)
    ↓
Confidence check (>60%)
    ↓
Plate detected → Pre-fill form
    ↓
Scanner closes → Manual entry fallback
```

### Dependencies

```json
{
  "dependencies": {
    "tesseract.js": "^5.0.0"
  }
}
```

### Key Components

#### 1. LicensePlateScanner Component

**Location:** `src/components/LicensePlateScanner.tsx`

**Props:**
```typescript
interface LicensePlateScannerProps {
  onPlateDetected: (plate: string, confidence: number) => void;
  onClose: () => void;
}
```

**Features:**
- Camera initialization with `navigator.mediaDevices.getUserMedia()`
- Continuous frame capture using `setInterval`
- OCR processing with Tesseract.js
- Indian license plate pattern validation
- Confidence threshold filtering
- Visual scanning overlay with animation
- Processing indicator
- Error handling for camera permissions

#### 2. CheckIn Component Integration

**Location:** `src/components/CheckIn.tsx`

**Changes:**
- Added scanner button next to plate input
- Added `showScanner` state
- Added `handlePlateDetected` callback
- Integrated `LicensePlateScanner` modal

## Indian License Plate Pattern

The scanner recognizes Indian license plates in the format:

```
State Code (2 letters) + RTO Code (1-2 digits) + Series (1-3 letters) + Number (4 digits)
```

**Examples:**
- `MH12AB1234` - Maharashtra, Mumbai West, AB series, 1234
- `KA03CD5678` - Karnataka, Bangalore South, CD series, 5678
- `DL5EF1234` - Delhi, Central, EF series, 1234
- `TN09G4567` - Tamil Nadu, Chennai North, G series, 4567

**Regex Pattern:**
```typescript
const platePattern = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/;
```

## OCR Processing Flow

### 1. Camera Initialization
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { 
    facingMode: 'environment', // Back camera on mobile
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
});
```

### 2. Frame Capture
```typescript
// Capture every 1.5 seconds
const scanInterval = setInterval(() => {
  if (!processing) {
    processFrame();
  }
}, 1500);
```

### 3. OCR Processing
```typescript
const result = await Tesseract.recognize(blob, 'eng', {
  logger: () => {}, // Suppress logging
});

const text = result.data.text.toUpperCase().replace(/\s/g, '');
```

### 4. Pattern Matching
```typescript
const matches = text.match(platePattern);

if (matches && matches[0]) {
  const detectedPlate = matches[0];
  const confidence = result.data.confidence;
  
  // Only accept if confidence > 60%
  if (confidence > 60 && detectedPlate !== lastDetectedPlate) {
    onPlateDetected(detectedPlate, confidence);
    stopCamera();
  }
}
```

## User Interface

### Scanner Button
Located next to the license plate input field:
- Camera icon with "Scan" text
- Gradient background (indigo to purple)
- Hover effects with shadow
- Disabled during submission

### Scanner Modal
Full-screen modal with:
- Live camera preview (16:9 aspect ratio)
- Scanning frame overlay with animated border
- Corner markers for alignment
- Processing indicator
- Tips for better recognition
- Manual entry fallback link

### Visual Feedback
- **Scanning animation**: Moving border line
- **Processing indicator**: Spinning loader with "Processing..." text
- **Success toast**: Shows detected plate and confidence percentage
- **Error handling**: Clear error messages for camera access issues

## Usage Guide

### For Parking Attendants

1. **Open Check-In Form**
   - Navigate to Operations tab
   - Click "Check In Vehicle" section

2. **Start Scanner**
   - Click the camera icon button next to plate input
   - Grant camera permissions when prompted

3. **Position Vehicle**
   - Hold camera steady
   - Position license plate within the frame
   - Ensure good lighting
   - Avoid glare and shadows

4. **Wait for Detection**
   - Scanner processes frames every 1.5 seconds
   - Processing indicator shows when OCR is running
   - Detection happens automatically

5. **Review Detection**
   - Success toast shows detected plate
   - Confidence percentage displayed
   - Plate is pre-filled in the form

6. **Complete Check-In**
   - Verify the detected plate
   - Select spot type
   - Click "Check In Vehicle"

### Manual Entry Fallback

If scanning fails:
- Click "Enter plate number manually →" link
- Type the plate number directly
- Continue with normal check-in flow

## Tips for Better Recognition

### Lighting
- ✅ Good ambient lighting
- ✅ Even illumination on plate
- ❌ Avoid harsh shadows
- ❌ Avoid direct sunlight glare

### Positioning
- ✅ Hold camera steady
- ✅ Position plate within frame
- ✅ Keep plate parallel to camera
- ❌ Avoid extreme angles

### Plate Condition
- ✅ Clean, readable plates
- ✅ Clear character separation
- ❌ Avoid dirty/damaged plates
- ❌ Avoid faded characters

### Camera Settings
- ✅ Use back camera (higher resolution)
- ✅ Allow camera to focus
- ✅ Keep distance 1-2 feet
- ❌ Avoid digital zoom

## Performance Considerations

### Processing Time
- **Frame capture**: Instant
- **OCR processing**: 1-3 seconds per frame
- **Total detection time**: 2-5 seconds (typical)

### Resource Usage
- **Camera stream**: ~30 FPS
- **OCR processing**: Every 1.5 seconds
- **Memory**: ~50-100 MB during scanning
- **CPU**: Moderate during OCR processing

### Optimization
- Frame processing throttled to 1.5s intervals
- Processing only when not already processing
- Camera stream stopped after detection
- Tesseract.js worker runs in background thread

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 53+
- ✅ Firefox 36+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Opera 40+

### Mobile Support
- ✅ iOS Safari 11+
- ✅ Android Chrome 53+
- ✅ Samsung Internet 6.2+

### Required APIs
- `navigator.mediaDevices.getUserMedia()` - Camera access
- `Canvas API` - Frame capture
- `Blob API` - Image processing
- `Web Workers` - Tesseract.js processing

## Error Handling

### Camera Access Denied
```typescript
catch (err) {
  setError('Unable to access camera. Please grant camera permissions and try again.');
}
```

**User Action:**
- Grant camera permissions in browser settings
- Check if camera is being used by another app
- Try a different browser

### OCR Processing Error
```typescript
catch (err) {
  console.error('OCR processing error:', err);
}
```

**User Action:**
- Scanner continues trying
- Manual entry fallback available
- No user-facing error (logged to console)

### Low Confidence Detection
```typescript
if (confidence > 60 && detectedPlate !== lastDetectedPlate) {
  // Accept detection
}
```

**User Action:**
- Scanner continues trying
- Adjust positioning/lighting
- Use manual entry if needed

## Testing the Feature

### Test Case 1: Successful Scan

**Setup:**
1. Open Check-In form
2. Click "Scan" button
3. Grant camera permissions

**Action:**
1. Position a clear license plate in frame
2. Wait for processing

**Expected:**
- ✅ Camera preview shows
- ✅ Scanning animation visible
- ✅ Processing indicator appears
- ✅ Success toast shows detected plate
- ✅ Plate pre-filled in form
- ✅ Scanner closes automatically

### Test Case 2: Low Confidence Detection

**Setup:**
1. Open scanner
2. Position dirty/faded plate

**Action:**
1. Wait for processing

**Expected:**
- ❌ Detection not accepted (confidence < 60%)
- ✅ Scanner continues trying
- ✅ Manual entry fallback available

### Test Case 3: Camera Permission Denied

**Setup:**
1. Open scanner
2. Deny camera permissions

**Expected:**
- ❌ Error message displayed
- ✅ "Try Again" button shown
- ✅ Manual entry fallback available

### Test Case 4: Manual Entry Fallback

**Setup:**
1. Open scanner
2. Click "Enter plate number manually →"

**Expected:**
- ✅ Scanner closes
- ✅ Manual entry form available
- ✅ Normal check-in flow continues

## Security & Privacy

### Camera Access
- Camera only active when scanner is open
- Camera stream stopped after detection or close
- No images stored or transmitted
- All processing happens locally in browser

### Data Handling
- No plate images saved
- OCR results not sent to server
- All processing client-side
- No third-party API calls

### Privacy Compliance
- ✅ No data collection
- ✅ No image storage
- ✅ Local processing only
- ✅ User consent required (camera permission)

## Future Enhancements

### Potential Improvements

1. **Multi-Frame Analysis**
   - Combine multiple frames for better accuracy
   - Reduce false positives
   - Handle motion blur

2. **Image Pre-Processing**
   - Contrast enhancement
   - Noise reduction
   - Edge detection
   - Perspective correction

3. **Advanced Pattern Recognition**
   - Support for different country formats
   - Custom plate patterns
   - Machine learning models

4. **Batch Scanning**
   - Scan multiple vehicles quickly
   - Queue processing
   - Bulk check-in

5. **Offline Support**
   - Cache Tesseract.js worker
   - Reduce load time
   - Work without internet

6. **Mobile Optimizations**
   - Torch/flashlight support
   - Auto-focus control
   - Zoom controls

7. **Analytics**
   - Scan success rate
   - Average detection time
   - Confidence distribution
   - Error rate tracking

## Integration with Existing Features

### Check-In Flow
```
Scanner detects plate
    ↓
Plate pre-filled in form
    ↓
User selects spot type
    ↓
User clicks "Check In Vehicle"
    ↓
Normal check-in process continues
```

### Validation
- Detected plate goes through same validation as manual entry
- Duplicate check-in prevention still applies
- Spot assignment logic unchanged

### Persistence
- Detected plate stored in localStorage like manual entry
- Transaction records identical regardless of entry method
- No difference in backend processing

## Troubleshooting

### Issue: Camera Not Working

**Possible Causes:**
- Camera permissions denied
- Camera in use by another app
- Browser doesn't support camera API
- Hardware issue

**Solutions:**
- Grant camera permissions in browser settings
- Close other apps using camera
- Try a different browser
- Check camera hardware

### Issue: Plate Not Detected

**Possible Causes:**
- Poor lighting
- Plate too far/close
- Plate dirty/damaged
- Camera out of focus

**Solutions:**
- Improve lighting conditions
- Adjust distance (1-2 feet)
- Clean the license plate
- Allow camera to focus
- Use manual entry

### Issue: Wrong Plate Detected

**Possible Causes:**
- OCR misread characters
- Similar looking characters (0/O, 1/I)
- Reflections or shadows

**Solutions:**
- Verify detected plate before check-in
- Improve lighting/positioning
- Edit plate manually if needed
- Use manual entry

### Issue: Scanner Too Slow

**Possible Causes:**
- Low-end device
- Large image resolution
- Background processes

**Solutions:**
- Use lower resolution camera
- Close other browser tabs
- Wait for processing to complete
- Use manual entry

## Conclusion

The license plate scanner provides a modern, efficient way to check in vehicles with:

- ✅ Fast OCR-based plate detection
- ✅ Indian license plate format support
- ✅ Confidence-based filtering
- ✅ Graceful fallback to manual entry
- ✅ User-friendly interface
- ✅ Privacy-focused (local processing)
- ✅ Cross-browser compatibility

The feature seamlessly integrates with the existing check-in flow while providing a significant improvement in user experience and efficiency.
