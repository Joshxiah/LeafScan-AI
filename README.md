# LeafScan AI

A MobileNetV2-Based Corn Leaf Disease Detection and Treatment
Recommendation System for Farmers.

An undergraduate thesis submitted to the Department of Computer Science,
College of Computing Studies, Western Mindanao State University.

## Researchers

- Realyn Joy T. Danong
- Virlyn G. Sandialan
- Jhoanna Marie S. Sumalpong

**Adviser:** Ferlyn P. Calanda

## Description

LeafScan AI detects and classifies corn leaf diseases from smartphone
images using a MobileNetV2 deep learning model, and delivers
expert-verified treatment recommendations managed by the City
Agriculture Office (CAO) of Pagadian City.

## Disease Classes

1. Healthy Corn Leaves
2. Common Rust
3. Northern Leaf Blight
4. Gray Leaf Spot

## System Components

| Component | Folder | Technology |
|---|---|---|
| Farmer mobile application | `mobile/` | React Native, Expo, TypeScript |
| CAO web admin platform | `admin-web/` | React, Vite, TypeScript, Tailwind CSS |
| REST API server | `backend/` | Node.js, Express.js, TypeScript |
| AI model and prediction service | `ai-model/` | Python, TensorFlow, MobileNetV2 |
| Database schema | `database/` | MySQL (MariaDB via XAMPP) |
| Documentation | `docs/` | Diagrams and screenshots |

## Confidence Levels

| Level | Range |
|---|---|
| Low | 0–39% |
| Moderate | 40–69% |
| High | 70–100% |

## Dataset Split

70% training / 15% validation / 15% testing

## Status

In development.