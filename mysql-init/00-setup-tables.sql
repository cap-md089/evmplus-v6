-- MySQL dump 10.13  Distrib 8.0.31, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: EventManagementv6
-- ------------------------------------------------------
-- Server version	8.0.19

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Accounts`
--

DROP TABLE IF EXISTS `Accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Accounts` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `id` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.id'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_A4A2D2706248415191E4A14C4A6061242BC437D2` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Attendance`
--

DROP TABLE IF EXISTS `Attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Attendance` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `accountID` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  `eventID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.eventID'))) STORED NOT NULL,
  `capID` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.memberID.id'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  KEY `ids` (`eventID`,`accountID`),
  KEY `accountAttendance` (`accountID`),
  CONSTRAINT `$val_strict_C0A0FB5F1ED7086B1195259DD8181F967F3B05C8` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Audits`
--

DROP TABLE IF EXISTS `Audits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Audits` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_935A60C7E62888DBDBEB757BF52501A28970C492` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChangeEvents`
--

DROP TABLE IF EXISTS `ChangeEvents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChangeEvents` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_0C3AF02E2A0E42DF44030CAF47439EBB7FBEBA5B` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ChangeLog`
--

DROP TABLE IF EXISTS `ChangeLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ChangeLog` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `ChangeLog_chk_1` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DiscordAccounts`
--

DROP TABLE IF EXISTS `DiscordAccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DiscordAccounts` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `discordID` varchar(32) GENERATED ALWAYS AS (json_extract(`doc`,_utf8mb4'$.discordID')) STORED NOT NULL,
  `member.id` varchar(32) GENERATED ALWAYS AS (json_extract(`doc`,_utf8mb4'$.member.id')) STORED NOT NULL,
  `member.type` varchar(32) GENERATED ALWAYS AS (json_extract(`doc`,_utf8mb4'$.member.type')) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `memberInfo` (`discordID`,`member.id`,`member.type`),
  CONSTRAINT `$val_strict_D4029FE1644F0EB99E7C7447F47E102DF81BB6F7` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Errors`
--

DROP TABLE IF EXISTS `Errors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Errors` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_F1E5F961077D5B9C0279CF8EE8510255B6653F53` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Events`
--

DROP TABLE IF EXISTS `Events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Events` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `id` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.id'))) STORED NOT NULL,
  `accountID` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  `pickupDateTime` bigint GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.pickupDateTime'))) STORED NOT NULL,
  `meetDateTime` bigint GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.meetDateTime'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `events_id` (`id`,`accountID`),
  CONSTRAINT `$val_strict_3C632DA43E8AC5989A4D1073D31894EB94D9E9E7` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ExtraAccountMembership`
--

DROP TABLE IF EXISTS `ExtraAccountMembership`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ExtraAccountMembership` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `member.type` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.member.type'))) STORED NOT NULL,
  `member.id` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.member.id'))) STORED NOT NULL,
  `accountID` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_F84905B7F438367370739B27F4FCF1C2607E48FE` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ExtraMemberInformation`
--

DROP TABLE IF EXISTS `ExtraMemberInformation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ExtraMemberInformation` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `accountID` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  `member.id` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.member.id'))) STORED,
  `member.type` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.member.type'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `ids` (`accountID`,`member.id`,`member.type`),
  CONSTRAINT `$val_strict_70360D5B383708B426C44117E24892EA68D71618` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Files`
--

DROP TABLE IF EXISTS `Files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Files` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `id` varchar(64) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.id'))) STORED NOT NULL,
  `accountID` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  `parentID` varchar(64) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.parentID'))) STORED,
  PRIMARY KEY (`_id`),
  KEY `ids` (`id`,`accountID`),
  KEY `idsForParents` (`id`,`accountID`,`parentID`),
  CONSTRAINT `$val_strict_67D2EFABD45BB5D2BB79D83C51CC2CB5F7DEB8E2` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MFASetup`
--

DROP TABLE IF EXISTS `MFASetup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MFASetup` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_F49F4F105013CAD59862CCC52B4FC4886AD0F2EA` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `MFATokens`
--

DROP TABLE IF EXISTS `MFATokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MFATokens` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_3BBE0DA7A821AE30CB06689E45DD63265D02FA59` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `MTC_Current`
--

DROP TABLE IF EXISTS `MTC_Current`;
/*!50001 DROP VIEW IF EXISTS `MTC_Current`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `MTC_Current` AS SELECT 
 1 AS `CAPID`,
 1 AS `NameLast`,
 1 AS `NameFirst`,
 1 AS `MemberTaskCreditID`,
 1 AS `TaskID`,
 1 AS `TaskName`,
 1 AS `Completed`,
 1 AS `Expiration`,
 1 AS `Comments`,
 1 AS `AdditionalOptions`,
 1 AS `PathID`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `MTC_Expanded`
--

DROP TABLE IF EXISTS `MTC_Expanded`;
/*!50001 DROP VIEW IF EXISTS `MTC_Expanded`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `MTC_Expanded` AS SELECT 
 1 AS `CAPID`,
 1 AS `NameLast`,
 1 AS `NameFirst`,
 1 AS `MemberTaskCreditID`,
 1 AS `TaskID`,
 1 AS `TaskName`,
 1 AS `Completed`,
 1 AS `Expiration`,
 1 AS `Comments`,
 1 AS `AdditionalOptions`,
 1 AS `PathID`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `MTC_Path`
--

DROP TABLE IF EXISTS `MTC_Path`;
/*!50001 DROP VIEW IF EXISTS `MTC_Path`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `MTC_Path` AS SELECT 
 1 AS `MemberTaskCreditID`,
 1 AS `TaskID`,
 1 AS `CAPID`,
 1 AS `StatusID`,
 1 AS `Completed`,
 1 AS `Expiration`,
 1 AS `Comments`,
 1 AS `AdditionalOptions`,
 1 AS `PathID`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `MemberSessions`
--

DROP TABLE IF EXISTS `MemberSessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MemberSessions` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_D5FEF428F98B426F784543E85182FBFDE5A69B99` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `MemberTaskCredit_AeroSDA`
--

DROP TABLE IF EXISTS `MemberTaskCredit_AeroSDA`;
/*!50001 DROP VIEW IF EXISTS `MemberTaskCredit_AeroSDA`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `MemberTaskCredit_AeroSDA` AS SELECT 
 1 AS `MemberTaskCreditID`,
 1 AS `TaskID`,
 1 AS `CAPID`,
 1 AS `StatusID`,
 1 AS `Completed`,
 1 AS `Expiration`,
 1 AS `Comments`,
 1 AS `AdditionalOptions`,
 1 AS `PathID`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `MemberTaskCredit_NoAeroSDA`
--

DROP TABLE IF EXISTS `MemberTaskCredit_NoAeroSDA`;
/*!50001 DROP VIEW IF EXISTS `MemberTaskCredit_NoAeroSDA`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `MemberTaskCredit_NoAeroSDA` AS SELECT 
 1 AS `MemberTaskCreditID`,
 1 AS `TaskID`,
 1 AS `CAPID`,
 1 AS `StatusID`,
 1 AS `Completed`,
 1 AS `Expiration`,
 1 AS `Comments`,
 1 AS `AdditionalOptions`,
 1 AS `PathID`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `NHQ_CadetAchv`
--

DROP TABLE IF EXISTS `NHQ_CadetAchv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_CadetAchv` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `CadetAchvID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CadetAchvID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `CAPID` (`CAPID`,`CadetAchvID`),
  CONSTRAINT `$val_strict_CABC212337AE5B540AD96ECCACE478E4FEDB6C44` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_CadetAchvAprs`
--

DROP TABLE IF EXISTS `NHQ_CadetAchvAprs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_CadetAchvAprs` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `CadetAchvID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CadetAchvID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `CAPID` (`CAPID`,`CadetAchvID`),
  CONSTRAINT `$val_strict_1E5942ABACDF6A72764C006E2C0A65269E12188B` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_CadetActivities`
--

DROP TABLE IF EXISTS `NHQ_CadetActivities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_CadetActivities` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `Type` varchar(63) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Type'))) STORED,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_090D62BE507A9E4A2A6C819C6EDCA80C3731AC5E` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_CadetDutyPosition`
--

DROP TABLE IF EXISTS `NHQ_CadetDutyPosition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_CadetDutyPosition` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) VIRTUAL,
  `FunctArea` varchar(64) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.FunctArea'))) STORED NOT NULL,
  `Duty` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Duty'))) STORED,
  PRIMARY KEY (`_id`),
  KEY `id` (`CAPID`),
  CONSTRAINT `$val_strict_7A559CDFD34D332A3527A6A8E17C0290D52BAEDB` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_CadetHFZInformation`
--

DROP TABLE IF EXISTS `NHQ_CadetHFZInformation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_CadetHFZInformation` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) VIRTUAL,
  `HFZID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.HFZID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `id` (`CAPID`),
  CONSTRAINT `NHQ_CadetHFZInformation_chk_1` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_CdtAchvEnum`
--

DROP TABLE IF EXISTS `NHQ_CdtAchvEnum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_CdtAchvEnum` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_E985360CDDAC05180D32D9A927ABA8B26A67B6A2` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_Commanders`
--

DROP TABLE IF EXISTS `NHQ_Commanders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_Commanders` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_029B5B176CC32E8B77B768685AE2E6694BEBBB6B` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_DutyPosition`
--

DROP TABLE IF EXISTS `NHQ_DutyPosition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_DutyPosition` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  KEY `id` (`CAPID`),
  CONSTRAINT `$val_strict_0AB6639981277C1587C5694B109C7334571C16E8` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_MbrAchievements`
--

DROP TABLE IF EXISTS `NHQ_MbrAchievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_MbrAchievements` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `Status` varchar(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Status'))) STORED NOT NULL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) STORED NOT NULL,
  `AchvID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.AchvID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `ids` (`CAPID`,`ORGID`),
  CONSTRAINT `$val_strict_80D42E50086430C2ACEF24C02E2C337024F91657` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_MbrContact`
--

DROP TABLE IF EXISTS `NHQ_MbrContact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_MbrContact` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) STORED,
  `Contact` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Contact'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  KEY `id` (`CAPID`),
  CONSTRAINT `$val_strict_8BA92350321711F50A67E3DF3DF0AFD99BD80E69` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_Member`
--

DROP TABLE IF EXISTS `NHQ_Member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_Member` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) STORED NOT NULL,
  `NameLast` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.NameLast'))) VIRTUAL,
  `NameFirst` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.NameFirst'))) VIRTUAL,
  `Type` varchar(15) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Type'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  KEY `ids` (`CAPID`,`ORGID`),
  CONSTRAINT `$val_strict_60C3811C5A99649AEDF27A7BD5FD0355DAEEE8A7` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_OFlight`
--

DROP TABLE IF EXISTS `NHQ_OFlight`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_OFlight` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_2D6D9C4885ADA5B62FE83CDA1285036C12A67BCD` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_OrgContact`
--

DROP TABLE IF EXISTS `NHQ_OrgContact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_OrgContact` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_D5C6B3FEDDD01263200157219624EB2F6709F3DA` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_Organization`
--

DROP TABLE IF EXISTS `NHQ_Organization`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_Organization` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `ORGID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.ORGID'))) STORED,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_B1E222D2A68B909E5A24D2E3DFFA989F3C33EC8E` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_Groups`
--

DROP TABLE IF EXISTS `NHQ_PL_Groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_Groups` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `PathID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.PathID'))) STORED NOT NULL,
  `GroupID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.GroupID'))) STORED NOT NULL,
  `GroupName` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.GroupName'))) VIRTUAL,
  `NumberOfRequiredTasks` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.NumberOfRequiredTasks'))) VIRTUAL,
  `AwardsExtraCredit` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.AwardsExtraCredit'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  KEY `GroupID` (`GroupID`),
  KEY `PathID` (`PathID`),
  CONSTRAINT `$val_strict_5030473494702308CCB6C98C3B66D545FAC2BF39` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_Lookup`
--

DROP TABLE IF EXISTS `NHQ_PL_Lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_Lookup` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_520DBCA79935245754CD03FA3C984406C4B397DA` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_MemberPathCredit`
--

DROP TABLE IF EXISTS `NHQ_PL_MemberPathCredit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_MemberPathCredit` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) STORED NOT NULL,
  `PathID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.PathID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `CAPID` (`CAPID`),
  KEY `PathID` (`PathID`),
  CONSTRAINT `$val_strict_250B02DEBD715D08F17AA7AF5F112186F6303A32` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_MemberTaskCredit`
--

DROP TABLE IF EXISTS `NHQ_PL_MemberTaskCredit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_MemberTaskCredit` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `CAPID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.CAPID'))) VIRTUAL,
  `Completed` varchar(25) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Completed'))) VIRTUAL,
  `StatusID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.StatusID'))) VIRTUAL,
  `TaskID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.TaskID'))) STORED,
  `MemberTaskCreditID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.MemberTaskCreditID'))) STORED NOT NULL,
  `Expiration` varchar(25) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Expiration'))) VIRTUAL,
  `Comments` varchar(500) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Comments'))) VIRTUAL,
  `AdditionalOptions` varchar(255) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.AdditionalOptions'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `MemberTaskCreditID` (`MemberTaskCreditID`),
  KEY `TaskID` (`TaskID`),
  KEY `CAPID` (`CAPID`),
  CONSTRAINT `$val_strict_870460BF481318C091DA723412BEB55290460835` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_Paths`
--

DROP TABLE IF EXISTS `NHQ_PL_Paths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_Paths` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `PathID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.PathID'))) STORED NOT NULL,
  `PathName` varchar(55) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.PathName'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `PathID` (`PathID`),
  CONSTRAINT `$val_strict_2304C55F5C6511375D123AA1AEEFD4E8F4DB8D3A` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_TaskGroupAssignments`
--

DROP TABLE IF EXISTS `NHQ_PL_TaskGroupAssignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_TaskGroupAssignments` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `GroupID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.GroupID'))) STORED NOT NULL,
  `TaskID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.TaskID'))) STORED NOT NULL,
  `TaskGroupAssignmentID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.TaskGroupAssignmentID'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  KEY `GroupID` (`GroupID`),
  KEY `TaskID` (`TaskID`),
  CONSTRAINT `$val_strict_00147FD5D9CCB38A44CB3B0C72D924ECB0996828` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_PL_Tasks`
--

DROP TABLE IF EXISTS `NHQ_PL_Tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_PL_Tasks` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `TaskID` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.TaskID'))) STORED,
  `TaskName` varchar(155) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.TaskName'))) VIRTUAL,
  `Description` varchar(200) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.Description'))) VIRTUAL,
  PRIMARY KEY (`_id`),
  UNIQUE KEY `TaskID` (`TaskID`),
  CONSTRAINT `$val_strict_56E1D5237BF172B2ECAF2FA48920E3B96836E615` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_SeniorAwards`
--

DROP TABLE IF EXISTS `NHQ_SeniorAwards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_SeniorAwards` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_D2F7DED7E2AAE5B4F2470F005ECF62308D85488B` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_SeniorLevel`
--

DROP TABLE IF EXISTS `NHQ_SeniorLevel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_SeniorLevel` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_3B6E1852681BA3AA50EE5541E0E8AC89DAA69B2E` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `NHQ_eServices_Session`
--

DROP TABLE IF EXISTS `NHQ_eServices_Session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `NHQ_eServices_Session` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_FAB606458C5D0DA7FD5255C26C5A6D5EF5E6EEF2` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Notifications`
--

DROP TABLE IF EXISTS `Notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notifications` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_2C4959700CD3B94EEDF23FA2A8D9DD65C13EE361` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `OAuthClients`
--

DROP TABLE IF EXISTS `OAuthClients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `OAuthClients` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_FB57E1FBF6B2B02EE721A718797F13E5E2CE0D1A` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PasswordResetTokens`
--

DROP TABLE IF EXISTS `PasswordResetTokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PasswordResetTokens` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_DFBBBCA15BC16B285DB2EE6D8A37967667B2EA2F` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ProspectiveMembers`
--

DROP TABLE IF EXISTS `ProspectiveMembers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ProspectiveMembers` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_9E00213E8DF2713EB779D4596AB8DD2D086ECBAF` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Registry`
--

DROP TABLE IF EXISTS `Registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Registry` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `accountID` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_EEF817971018C6FD35CE173AEF1206EACC631A92` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Sessions`
--

DROP TABLE IF EXISTS `Sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Sessions` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_07ECAF6BF90473973A2A49EC2FA2566DB478DBF2` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SignInLog`
--

DROP TABLE IF EXISTS `SignInLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SignInLog` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `accountID` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED,
  `memberID` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.memberRef.id'))) STORED,
  `DateMod` varchar(45) GENERATED ALWAYS AS (from_unixtime(floor((json_unquote(json_extract(`doc`,_utf8mb4'$.lastAccessTime')) / 1000)))) VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_900180FF6932D3B2085F8C8A3283C6537302F014` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SignatureNonces`
--

DROP TABLE IF EXISTS `SignatureNonces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SignatureNonces` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_DD0AA283980996A646A43212342B69B4FBFC097C` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SigninKeys`
--

DROP TABLE IF EXISTS `SigninKeys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SigninKeys` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_1D56F8DA62DDAEDC4A6D27DA756CDB9599116F94` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SigninTokens`
--

DROP TABLE IF EXISTS `SigninTokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SigninTokens` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_A6CB598E9681DF732D64502D8554F85884F2B71E` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `TaskGroupAssignmentsExpanded`
--

DROP TABLE IF EXISTS `TaskGroupAssignmentsExpanded`;
/*!50001 DROP VIEW IF EXISTS `TaskGroupAssignmentsExpanded`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `TaskGroupAssignmentsExpanded` AS SELECT 
 1 AS `TaskGroupAssignmentID`,
 1 AS `TaskID`,
 1 AS `TaskName`,
 1 AS `Description`,
 1 AS `GroupID`,
 1 AS `PathID`,
 1 AS `PathName`,
 1 AS `GroupName`,
 1 AS `NumberOfRequiredTasks`,
 1 AS `AwardsExtraCredit`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `Tasks`
--

DROP TABLE IF EXISTS `Tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tasks` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_7CAF439806BE0245C9F2B3B4CCC7FA14BA1C6766` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Teams`
--

DROP TABLE IF EXISTS `Teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Teams` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `id` int GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.id'))) STORED NOT NULL,
  `accountID` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.accountID'))) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  KEY `ids` (`id`,`accountID`),
  CONSTRAINT `$val_strict_00D6EF60B1D4AFCBC9E054240ED30922C0BD2949` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Tokens`
--

DROP TABLE IF EXISTS `Tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tokens` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_DFBAFC57E6D619DA81BF24796B21DA0E40142383` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserAccountInfo`
--

DROP TABLE IF EXISTS `UserAccountInfo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserAccountInfo` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `username` varchar(45) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.username'))) STORED NOT NULL,
  `memberid` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.member.id'))) STORED,
  `membertype` varchar(30) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$.member.type'))) STORED,
  PRIMARY KEY (`_id`),
  KEY `memberInfo` (`username`,`memberid`,`membertype`),
  CONSTRAINT `$val_strict_4DEC333182A34018B4D38211584FBB98A8B43BA3` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserAccountTokens`
--

DROP TABLE IF EXISTS `UserAccountTokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserAccountTokens` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_DB34C6D975FD2CABCBD4A087AC0A598AA5E5512E` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserPermissions`
--

DROP TABLE IF EXISTS `UserPermissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserPermissions` (
  `doc` json DEFAULT NULL,
  `_id` varbinary(32) GENERATED ALWAYS AS (json_unquote(json_extract(`doc`,_utf8mb4'$._id'))) STORED NOT NULL,
  `_json_schema` json GENERATED ALWAYS AS (_utf8mb4'{"type":"object"}') VIRTUAL,
  `accountID` varchar(30) GENERATED ALWAYS AS (json_extract(`doc`,_utf8mb4'$.accountID')) STORED NOT NULL,
  PRIMARY KEY (`_id`),
  CONSTRAINT `$val_strict_73AAF9AF5B95C6CAFB343B3792345449A5144828` CHECK (json_schema_valid(`_json_schema`,`doc`)) /*!80016 NOT ENFORCED */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Final view structure for view `MTC_Current`
--

/*!50001 DROP VIEW IF EXISTS `MTC_Current`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `MTC_Current` AS select `mtce`.`CAPID` AS `CAPID`,`mtce`.`NameLast` AS `NameLast`,`mtce`.`NameFirst` AS `NameFirst`,`mtce`.`MemberTaskCreditID` AS `MemberTaskCreditID`,`mtce`.`TaskID` AS `TaskID`,`mtce`.`TaskName` AS `TaskName`,`mtce`.`Completed` AS `Completed`,`mtce`.`Expiration` AS `Expiration`,`mtce`.`Comments` AS `Comments`,`mtce`.`AdditionalOptions` AS `AdditionalOptions`,`mtce`.`PathID` AS `PathID` from (`MTC_Expanded` `mtce` left join `NHQ_PL_MemberPathCredit` `mtc` on(((`mtc`.`PathID` = `mtce`.`PathID`) and (`mtc`.`CAPID` = `mtce`.`CAPID`)))) where (`mtc`.`CAPID` is null) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `MTC_Expanded`
--

/*!50001 DROP VIEW IF EXISTS `MTC_Expanded`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `MTC_Expanded` AS select `NHQ_Member`.`CAPID` AS `CAPID`,`NHQ_Member`.`NameLast` AS `NameLast`,`NHQ_Member`.`NameFirst` AS `NameFirst`,`MTC_Path`.`MemberTaskCreditID` AS `MemberTaskCreditID`,`MTC_Path`.`TaskID` AS `TaskID`,`NHQ_PL_Tasks`.`TaskName` AS `TaskName`,`MTC_Path`.`Completed` AS `Completed`,`MTC_Path`.`Expiration` AS `Expiration`,`MTC_Path`.`Comments` AS `Comments`,`MTC_Path`.`AdditionalOptions` AS `AdditionalOptions`,`MTC_Path`.`PathID` AS `PathID` from ((`MTC_Path` join `NHQ_Member` on((`MTC_Path`.`CAPID` = `NHQ_Member`.`CAPID`))) join `NHQ_PL_Tasks` on((`MTC_Path`.`TaskID` = `NHQ_PL_Tasks`.`TaskID`))) where ((`MTC_Path`.`PathID` >= 31) and (`NHQ_Member`.`Type` = 'CADET')) order by `NHQ_Member`.`CAPID`,`MTC_Path`.`PathID` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `MTC_Path`
--

/*!50001 DROP VIEW IF EXISTS `MTC_Path`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `MTC_Path` AS select `MemberTaskCredit_AeroSDA`.`MemberTaskCreditID` AS `MemberTaskCreditID`,`MemberTaskCredit_AeroSDA`.`TaskID` AS `TaskID`,`MemberTaskCredit_AeroSDA`.`CAPID` AS `CAPID`,`MemberTaskCredit_AeroSDA`.`StatusID` AS `StatusID`,`MemberTaskCredit_AeroSDA`.`Completed` AS `Completed`,`MemberTaskCredit_AeroSDA`.`Expiration` AS `Expiration`,`MemberTaskCredit_AeroSDA`.`Comments` AS `Comments`,`MemberTaskCredit_AeroSDA`.`AdditionalOptions` AS `AdditionalOptions`,`MemberTaskCredit_AeroSDA`.`PathID` AS `PathID` from `MemberTaskCredit_AeroSDA` union select `MemberTaskCredit_NoAeroSDA`.`MemberTaskCreditID` AS `MemberTaskCreditID`,`MemberTaskCredit_NoAeroSDA`.`TaskID` AS `TaskID`,`MemberTaskCredit_NoAeroSDA`.`CAPID` AS `CAPID`,`MemberTaskCredit_NoAeroSDA`.`StatusID` AS `StatusID`,`MemberTaskCredit_NoAeroSDA`.`Completed` AS `Completed`,`MemberTaskCredit_NoAeroSDA`.`Expiration` AS `Expiration`,`MemberTaskCredit_NoAeroSDA`.`Comments` AS `Comments`,`MemberTaskCredit_NoAeroSDA`.`AdditionalOptions` AS `AdditionalOptions`,`MemberTaskCredit_NoAeroSDA`.`PathID` AS `PathID` from `MemberTaskCredit_NoAeroSDA` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `MemberTaskCredit_AeroSDA`
--

/*!50001 DROP VIEW IF EXISTS `MemberTaskCredit_AeroSDA`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `MemberTaskCredit_AeroSDA` AS select `NHQ_PL_MemberTaskCredit`.`MemberTaskCreditID` AS `MemberTaskCreditID`,`NHQ_PL_MemberTaskCredit`.`TaskID` AS `TaskID`,`NHQ_PL_MemberTaskCredit`.`CAPID` AS `CAPID`,`NHQ_PL_MemberTaskCredit`.`StatusID` AS `StatusID`,`NHQ_PL_MemberTaskCredit`.`Completed` AS `Completed`,`NHQ_PL_MemberTaskCredit`.`Expiration` AS `Expiration`,`NHQ_PL_MemberTaskCredit`.`Comments` AS `Comments`,`NHQ_PL_MemberTaskCredit`.`AdditionalOptions` AS `AdditionalOptions`,if((left(`NHQ_PL_MemberTaskCredit`.`AdditionalOptions`,12) = '{PunchedPath'),cast(substr(`NHQ_PL_MemberTaskCredit`.`AdditionalOptions`,14,2) as unsigned),0) AS `PathID` from `NHQ_PL_MemberTaskCredit` where (if((left(`NHQ_PL_MemberTaskCredit`.`AdditionalOptions`,12) = '{PunchedPath'),cast(substr(`NHQ_PL_MemberTaskCredit`.`AdditionalOptions`,14,2) as unsigned),0) > 0) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `MemberTaskCredit_NoAeroSDA`
--

/*!50001 DROP VIEW IF EXISTS `MemberTaskCredit_NoAeroSDA`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `MemberTaskCredit_NoAeroSDA` AS select `NHQ_PL_MemberTaskCredit`.`MemberTaskCreditID` AS `MemberTaskCreditID`,`NHQ_PL_MemberTaskCredit`.`TaskID` AS `TaskID`,`NHQ_PL_MemberTaskCredit`.`CAPID` AS `CAPID`,`NHQ_PL_MemberTaskCredit`.`StatusID` AS `StatusID`,`NHQ_PL_MemberTaskCredit`.`Completed` AS `Completed`,`NHQ_PL_MemberTaskCredit`.`Expiration` AS `Expiration`,`NHQ_PL_MemberTaskCredit`.`Comments` AS `Comments`,`NHQ_PL_MemberTaskCredit`.`AdditionalOptions` AS `AdditionalOptions`,`TaskGroupAssignmentsExpanded`.`PathID` AS `PathID` from (`NHQ_PL_MemberTaskCredit` join `TaskGroupAssignmentsExpanded` on((`NHQ_PL_MemberTaskCredit`.`TaskID` = `TaskGroupAssignmentsExpanded`.`TaskID`))) where ((`NHQ_PL_MemberTaskCredit`.`TaskID` < 324) or ((`NHQ_PL_MemberTaskCredit`.`TaskID` > 324) and (`NHQ_PL_MemberTaskCredit`.`TaskID` < 334)) or ((`NHQ_PL_MemberTaskCredit`.`TaskID` > 339) and (`NHQ_PL_MemberTaskCredit`.`TaskID` < 375)) or ((`NHQ_PL_MemberTaskCredit`.`TaskID` > 375) and (`NHQ_PL_MemberTaskCredit`.`TaskID` < 384)) or ((`NHQ_PL_MemberTaskCredit`.`TaskID` > 391) and (`NHQ_PL_MemberTaskCredit`.`TaskID` < 394)) or (`NHQ_PL_MemberTaskCredit`.`TaskID` > 399)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `TaskGroupAssignmentsExpanded`
--

/*!50001 DROP VIEW IF EXISTS `TaskGroupAssignmentsExpanded`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `TaskGroupAssignmentsExpanded` AS select `NHQ_PL_TaskGroupAssignments`.`TaskGroupAssignmentID` AS `TaskGroupAssignmentID`,`NHQ_PL_TaskGroupAssignments`.`TaskID` AS `TaskID`,`NHQ_PL_Tasks`.`TaskName` AS `TaskName`,`NHQ_PL_Tasks`.`Description` AS `Description`,`NHQ_PL_TaskGroupAssignments`.`GroupID` AS `GroupID`,`NHQ_PL_Groups`.`PathID` AS `PathID`,`NHQ_PL_Paths`.`PathName` AS `PathName`,`NHQ_PL_Groups`.`GroupName` AS `GroupName`,`NHQ_PL_Groups`.`NumberOfRequiredTasks` AS `NumberOfRequiredTasks`,`NHQ_PL_Groups`.`AwardsExtraCredit` AS `AwardsExtraCredit` from (`NHQ_PL_Tasks` join (`NHQ_PL_Paths` join (`NHQ_PL_Groups` join `NHQ_PL_TaskGroupAssignments` on((`NHQ_PL_Groups`.`GroupID` = `NHQ_PL_TaskGroupAssignments`.`GroupID`))) on((`NHQ_PL_Paths`.`PathID` = `NHQ_PL_Groups`.`PathID`))) on((`NHQ_PL_Tasks`.`TaskID` = `NHQ_PL_TaskGroupAssignments`.`TaskID`))) order by `NHQ_PL_Groups`.`PathID`,`NHQ_PL_TaskGroupAssignments`.`GroupID`,`NHQ_PL_Tasks`.`TaskID` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-11-23 15:05:42
