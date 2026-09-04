-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cleancity
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `role` varchar(30) DEFAULT NULL,
  `activity` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_notifications`
--

DROP TABLE IF EXISTS `admin_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_notifications_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_notifications`
--

LOCK TABLES `admin_notifications` WRITE;
/*!40000 ALTER TABLE `admin_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(30) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mobile_number` varchar(15) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `must_change_password` tinyint(1) DEFAULT '1',
  `profile_photo` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'ADM001','ADMIN','admin235@cleancity.com','$2b$12$uTymQrNh4rWD12Csj1cLfuzFxrR443.//kTI4KWKfESM3ukZR1dGG','9876543879','Municipal Administrator','2026-07-17 07:59:16',0,'uploads\\38e319a6976a4680a53d9c66476d102a_20260321_1522_Casual_Indian_Attire_remix_01km7wxyxgegj9fz09z9fs07f0_2.png');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_analysis`
--

DROP TABLE IF EXISTS `ai_analysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_analysis` (
  `ai_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `predicted_category` varchar(100) DEFAULT NULL,
  `confidence` decimal(5,2) DEFAULT NULL,
  `ai_response` text,
  `analyzed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ai_id`),
  KEY `complaint_id` (`complaint_id`),
  CONSTRAINT `ai_analysis_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_analysis`
--

LOCK TABLES `ai_analysis` WRITE;
/*!40000 ALTER TABLE `ai_analysis` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_analysis` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assignments`
--

DROP TABLE IF EXISTS `assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignments` (
  `assignment_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `worker_id` int NOT NULL,
  `vehicle_id` int NOT NULL,
  `assigned_by_admin` int NOT NULL,
  `assignment_status` enum('Assigned','Accepted','In Progress','Completed','Rejected') DEFAULT 'Assigned',
  `dispatch_time` datetime DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `completion_time` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`assignment_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `worker_id` (`worker_id`),
  KEY `vehicle_id` (`vehicle_id`),
  KEY `assigned_by_admin` (`assigned_by_admin`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`),
  CONSTRAINT `assignments_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`),
  CONSTRAINT `assignments_ibfk_3` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`),
  CONSTRAINT `assignments_ibfk_4` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`),
  CONSTRAINT `assignments_ibfk_5` FOREIGN KEY (`assigned_by_admin`) REFERENCES `admins` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assignments`
--

LOCK TABLES `assignments` WRITE;
/*!40000 ALTER TABLE `assignments` DISABLE KEYS */;
/*!40000 ALTER TABLE `assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `broadcasts`
--

DROP TABLE IF EXISTS `broadcasts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcasts` (
  `broadcast_id` int NOT NULL AUTO_INCREMENT,
  `supervisor_id` int DEFAULT NULL,
  `zone_id` int DEFAULT NULL,
  `title` varchar(150) DEFAULT NULL,
  `message` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`broadcast_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `zone_id` (`zone_id`),
  CONSTRAINT `broadcasts_ibfk_1` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`),
  CONSTRAINT `broadcasts_ibfk_2` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcasts`
--

LOCK TABLES `broadcasts` WRITE;
/*!40000 ALTER TABLE `broadcasts` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcasts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cleanpoints`
--

DROP TABLE IF EXISTS `cleanpoints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cleanpoints` (
  `points_id` int NOT NULL AUTO_INCREMENT,
  `citizen_id` int NOT NULL,
  `complaint_id` int NOT NULL,
  `points` int DEFAULT '0',
  `reason` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`points_id`),
  KEY `citizen_id` (`citizen_id`),
  KEY `complaint_id` (`complaint_id`),
  CONSTRAINT `cleanpoints_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `cleanpoints_ibfk_2` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cleanpoints`
--

LOCK TABLES `cleanpoints` WRITE;
/*!40000 ALTER TABLE `cleanpoints` DISABLE KEYS */;
/*!40000 ALTER TABLE `cleanpoints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `complaint_id` int NOT NULL AUTO_INCREMENT,
  `complaint_code` varchar(20) DEFAULT NULL,
  `citizen_id` int NOT NULL,
  `zone_id` int NOT NULL,
  `supervisor_id` int DEFAULT NULL,
  `worker_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `image_before` varchar(255) DEFAULT NULL,
  `image_after` varchar(255) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `description` text,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `address` text,
  `ai_category` varchar(100) DEFAULT NULL,
  `ai_confidence` decimal(5,2) DEFAULT NULL,
  `priority` enum('Low','Medium','High') DEFAULT 'Medium',
  `status` enum('Submitted','Assigned','In Progress','Verification','Resolved') DEFAULT 'Submitted',
  `verification_status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `sla_deadline` datetime DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` datetime DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ai_reason` text,
  `feedback_given` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`complaint_id`),
  UNIQUE KEY `complaint_code` (`complaint_code`),
  KEY `citizen_id` (`citizen_id`),
  KEY `zone_id` (`zone_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `worker_id` (`worker_id`),
  KEY `vehicle_id` (`vehicle_id`),
  CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`citizen_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`zone_id`),
  CONSTRAINT `complaints_ibfk_3` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`),
  CONSTRAINT `complaints_ibfk_4` FOREIGN KEY (`worker_id`) REFERENCES `workers` (`worker_id`),
  CONSTRAINT `complaints_ibfk_5` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`vehicle_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `department_id` int NOT NULL AUTO_INCREMENT,
  `department_name` varchar(100) NOT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Household Waste Management Department','020-11111111','household@cleancity.com','Municipal Office','2026-07-22 16:58:17'),(2,'Plastic Waste Management Department','020-22222222','plastic@cleancity.com','Municipal Office','2026-07-22 16:58:17'),(3,'Hazardous Waste Management Department','020-33333333','hazard@cleancity.com','Municipal Office','2026-07-22 16:58:17'),(4,'Construction & Demolition Waste Management Department','020-44444444','construction@cleancity.com','Municipal Office','2026-07-27 07:06:09');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `complaint_id` int NOT NULL,
  `citizen_id` int NOT NULL,
  `feedback_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolution_quality` tinyint NOT NULL,
  `worker_conduct` tinyint NOT NULL,
  `overall_experience` tinyint NOT NULL,
  `comment` text,
  PRIMARY KEY (`feedback_id`),
  KEY `complaint_id` (`complaint_id`),
  KEY `citizen_id` (`citizen_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`),
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`citizen_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `message` text,
  `notification_type` enum('Complaint','Assignment','Verification','Broadcast','Reward') DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verification`
--

DROP TABLE IF EXISTS `otp_verification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verification` (
  `otp_id` int NOT NULL AUTO_INCREMENT,
  `mobile_number` varchar(15) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`otp_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verification`
--

LOCK TABLES `otp_verification` WRITE;
/*!40000 ALTER TABLE `otp_verification` DISABLE KEYS */;
/*!40000 ALTER TABLE `otp_verification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisor_notifications`
--

DROP TABLE IF EXISTS `supervisor_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisor_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `supervisor_id` int NOT NULL,
  `complaint_id` int DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `complaint_id` (`complaint_id`),
  CONSTRAINT `supervisor_notifications_ibfk_1` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`),
  CONSTRAINT `supervisor_notifications_ibfk_2` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`complaint_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisor_notifications`
--

LOCK TABLES `supervisor_notifications` WRITE;
/*!40000 ALTER TABLE `supervisor_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `supervisor_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisors`
--

DROP TABLE IF EXISTS `supervisors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisors` (
  `supervisor_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(30) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mobile_number` varchar(15) DEFAULT NULL,
  `zone_id` int NOT NULL,
  `status` enum('Active','Inactive','On Leave') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `must_change_password` tinyint(1) DEFAULT '1',
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`supervisor_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `zone_id` (`zone_id`),
  CONSTRAINT `supervisors_ibfk_1` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`zone_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisors`
--

LOCK TABLES `supervisors` WRITE;
/*!40000 ALTER TABLE `supervisors` DISABLE KEYS */;
INSERT INTO `supervisors` VALUES (1,'SUP001','Rahul Sharma','rahul@gmail.com','$2b$12$Vn1HDviAvIjWPNOCT//muONi1ZlLjpIbiBKEN7OkCVuXEP8Q0Q5YK','9876543210',1,'Active','2026-07-22 16:34:20',0,'uploads\\7014444a84c449d3adbeba8612ab36a3_image_2.png'),(2,'SUP002','Priya Verma','priya@cleancity.com','$2b$12$uHqBqgqDfjhg4s56NqnoeuPZW7kXIkMHmGCkR6qAm59SgaaXzxyzC','9876543212',2,'Active','2026-07-22 16:34:20',1,'uploads\\5eb6094b949440d8bf4e20fbe23b73fd_WhatsApp_Image_2025-02-21_at_12.53.51_AM.jpeg');
/*!40000 ALTER TABLE `supervisors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('Citizen') DEFAULT 'Citizen',
  `is_verified` tinyint(1) DEFAULT '0',
  `session_token` varchar(255) DEFAULT NULL,
  `token_expiry` datetime DEFAULT NULL,
  `clean_points` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `profile_photo` varchar(255) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `vehicle_id` int NOT NULL AUTO_INCREMENT,
  `vehicle_number` varchar(30) NOT NULL,
  `vehicle_type` enum('Mini Garbage Van','Compactor Truck','Dump Truck','Drain Cleaner','Street Sweeper') DEFAULT NULL,
  `zone_id` int NOT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `driver_phone` varchar(15) DEFAULT NULL,
  `status` enum('Available','On Route','Busy','Maintenance') DEFAULT 'Available',
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`vehicle_id`),
  UNIQUE KEY `vehicle_number` (`vehicle_number`),
  KEY `zone_id` (`zone_id`),
  CONSTRAINT `vehicles_ibfk_1` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`zone_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicles`
--

LOCK TABLES `vehicles` WRITE;
/*!40000 ALTER TABLE `vehicles` DISABLE KEYS */;
INSERT INTO `vehicles` VALUES (1,'MH12AB1001','Mini Garbage Van',1,'Ramesh Kumar','9876543311','Available',18.52040000,73.85670000,'2026-07-22 17:08:37'),(2,'MH12AB1002','Compactor Truck',1,'Suresh Patil','9876543312','Available',18.52750000,73.84780000,'2026-07-22 17:08:37'),(3,'MH12AB1003','Street Sweeper',1,'Mahesh Jadhav','9876543313','Maintenance',18.51520000,73.86240000,'2026-07-22 17:08:37'),(4,'MH12AB2001','Dump Truck',2,'Vikram Shinde','9876543314','Available',18.55900000,73.78680000,'2026-07-22 17:08:37'),(5,'MH12AB2002','Drain Cleaner',2,'Ganesh More','9876543315','Busy',18.54890000,73.80150000,'2026-07-22 17:08:37');
/*!40000 ALTER TABLE `vehicles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workers`
--

DROP TABLE IF EXISTS `workers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workers` (
  `worker_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(30) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mobile_number` varchar(15) DEFAULT NULL,
  `department_id` int NOT NULL,
  `supervisor_id` int NOT NULL,
  `zone_id` int NOT NULL,
  `crew_name` varchar(100) DEFAULT NULL,
  `status` enum('Available','Busy','On Leave') DEFAULT 'Available',
  `average_rating` decimal(2,1) DEFAULT '5.0',
  `current_latitude` decimal(10,8) DEFAULT NULL,
  `current_longitude` decimal(11,8) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `must_change_password` tinyint(1) DEFAULT '1',
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`worker_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `email` (`email`),
  KEY `department_id` (`department_id`),
  KEY `supervisor_id` (`supervisor_id`),
  KEY `zone_id` (`zone_id`),
  CONSTRAINT `workers_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`),
  CONSTRAINT `workers_ibfk_2` FOREIGN KEY (`supervisor_id`) REFERENCES `supervisors` (`supervisor_id`),
  CONSTRAINT `workers_ibfk_3` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`zone_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workers`
--

LOCK TABLES `workers` WRITE;
/*!40000 ALTER TABLE `workers` DISABLE KEYS */;
INSERT INTO `workers` VALUES (1,'WRK001','Amit Kumar','amit@cleancity.com','$2b$12$SxNkBiU5Q0sPSrLH.3mG1Oi.sBwCYtCjBr3zTFf7/GVIIx1ePiY.S','98765432221',1,1,1,'Crew A','Available',5.0,NULL,NULL,'2026-07-22 16:46:48',0,'uploads/worker_profiles/worker_1.png'),(2,'WRK002','Neha Singh','neha@cleancity.com','$2b$12$jfS6di5jm.rG.4oAv7ZS9u5b2y9S1y0CaBeuTxo4UK/WI1RUhO83O','9876543222',2,1,1,'Crew A','Busy',5.0,NULL,NULL,'2026-07-22 16:46:48',1,'uploads/worker_profiles/worker_2.png'),(3,'WRK003','Rohit Patil','rohit@cleancity.com','$2b$12$sWzFFWUTzJO9Ym5xPRwBu..GwIbjVg7bdNugKPeSe02QL52wuiU52','9876543223',4,2,2,'Crew B','Available',5.0,NULL,NULL,'2026-07-22 16:46:48',1,'uploads/worker_profiles/worker_3.jpeg'),(4,'WRK004','Sneha Joshi','sneha@cleancity.com','$2b$12$Y9.p8JA8dB6puqOcnwaTNugFFtyeo985lY/KbsnVa3TBrVTa6jtZ2','9876543224',3,2,2,'Crew B','Available',5.0,NULL,NULL,'2026-07-22 16:46:48',1,'uploads/worker_profiles/worker_4.jpeg');
/*!40000 ALTER TABLE `workers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zones`
--

DROP TABLE IF EXISTS `zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zones` (
  `zone_id` int NOT NULL AUTO_INCREMENT,
  `zone_name` varchar(100) NOT NULL,
  `district_name` varchar(100) NOT NULL,
  `ward_number` varchar(30) DEFAULT NULL,
  `zone_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`zone_id`),
  UNIQUE KEY `zone_code` (`zone_code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zones`
--

LOCK TABLES `zones` WRITE;
/*!40000 ALTER TABLE `zones` DISABLE KEYS */;
INSERT INTO `zones` VALUES (1,'Shivajinagar Zone','Pune','Ward A','PUN-Z01','2026-07-22 19:08:03'),(2,'Kothrud Zone','Pune','Ward B','PUN-Z02','2026-07-22 19:08:03');
/*!40000 ALTER TABLE `zones` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-04 16:55:42
