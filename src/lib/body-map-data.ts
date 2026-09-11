export const bodyRegionSpecialties: Record<string, { label: string; specialties: string[] }> = {
  // Front & Back shared (Head, Neck, Pelvis)
  head: { label: "Head", specialties: ["Neurology", "Psychiatry", "Ophthalmology", "Dentistry", "Dermatology", "ENT Specialist", "General Medicine"] },
  neck: { label: "Neck", specialties: ["ENT Specialist", "General Medicine"] },
  pelvis: { label: "Pelvis", specialties: ["Gynecology", "General Medicine"] },
  
  // Torso
  chest: { label: "Chest", specialties: ["Cardiology", "General Medicine", "Pediatrics"] },
  abdomen: { label: "Abdomen", specialties: ["Gastroenterology", "Gynecology", "General Medicine", "Pediatrics"] },
  upper_back: { label: "Upper Back", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  lower_back: { label: "Lower Back", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  
  // Left Arm & Hand
  left_arm: { label: "Left Arm", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  left_forearm: { label: "Left Forearm", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  left_hand: { label: "Left Hand", specialties: ["Orthopedics", "Dermatology", "General Medicine", "Pediatrics"] },
  
  // Right Arm & Hand
  right_arm: { label: "Right Arm", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  right_forearm: { label: "Right Forearm", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  right_hand: { label: "Right Hand", specialties: ["Orthopedics", "Dermatology", "General Medicine", "Pediatrics"] },
  
  // Left Leg & Foot
  left_thigh: { label: "Left Thigh", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  left_knee: { label: "Left Knee", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  left_lower_leg: { label: "Left Lower Leg", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  left_foot: { label: "Left Foot", specialties: ["Orthopedics", "Dermatology", "General Medicine", "Pediatrics"] },
  
  // Right Leg & Foot
  right_thigh: { label: "Right Thigh", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  right_knee: { label: "Right Knee", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  right_lower_leg: { label: "Right Lower Leg", specialties: ["Orthopedics", "General Medicine", "Pediatrics"] },
  right_foot: { label: "Right Foot", specialties: ["Orthopedics", "Dermatology", "General Medicine", "Pediatrics"] },
};
