-- MySQL dump 10.16  Distrib 10.1.48-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: saas95
-- ------------------------------------------------------
-- Server version	10.1.48-MariaDB-0+deb9u2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `access_slugs`
--

DROP TABLE IF EXISTS `access_slugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `access_slugs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `access_slug` varchar(255) DEFAULT NULL,
  `date_created` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cf_compiled_scf`
--

DROP TABLE IF EXISTS `cf_compiled_scf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cf_compiled_scf` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `access_slug` varchar(255) DEFAULT NULL,
  `open_period` date DEFAULT NULL,
  `close_period` date DEFAULT NULL,
  `caption_section` varchar(255) DEFAULT NULL,
  `caption_description` varchar(255) DEFAULT NULL,
  `line_value` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11579 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cf_rec_table`
--

DROP TABLE IF EXISTS `cf_rec_table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cf_rec_table` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cashflow_caption_id` int(11) DEFAULT NULL,
  `cashflow_caption` varchar(255) DEFAULT NULL,
  `open_period` date DEFAULT NULL,
  `close_period` date DEFAULT NULL,
  `rec_value` decimal(15,2) DEFAULT NULL,
  `account_id` int(11) DEFAULT NULL,
  `access_slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2468 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cf_reconciliation_notes`
--

DROP TABLE IF EXISTS `cf_reconciliation_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cf_reconciliation_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(11) DEFAULT NULL,
  `cashflow_caption_id` int(11) DEFAULT NULL,
  `open_period` date DEFAULT NULL,
  `close_period` date DEFAULT NULL,
  `note_text` text,
  `access_slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cf_trial_balance`
--

DROP TABLE IF EXISTS `cf_trial_balance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cf_trial_balance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_caption` varchar(255) DEFAULT NULL,
  `period_date` date DEFAULT NULL,
  `debit` decimal(15,2) DEFAULT NULL,
  `credit` decimal(15,2) DEFAULT NULL,
  `access_slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10479 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `cf_trial_balance_mapping`
--

DROP TABLE IF EXISTS `cf_trial_balance_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cf_trial_balance_mapping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_caption` varchar(255) DEFAULT NULL,
  `account_type` varchar(50) DEFAULT NULL,
  `access_slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3377 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `error_log`
--

DROP TABLE IF EXISTS `error_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `error_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `caller` varchar(255) DEFAULT NULL,
  `request_description` varchar(255) DEFAULT NULL,
  `stack_error` text,
  `error_timestamp` datetime DEFAULT NULL,
  `access_slug` varchar(255) DEFAULT NULL,
  `inputs` text,
  `query` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `statement_of_cashflows`
--

DROP TABLE IF EXISTS `statement_of_cashflows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `statement_of_cashflows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) DEFAULT NULL,
  `caption_description` varchar(255) DEFAULT NULL,
  `section_type` varchar(255) DEFAULT NULL,
  `access_slug` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1300 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-12-08  9:09:05
