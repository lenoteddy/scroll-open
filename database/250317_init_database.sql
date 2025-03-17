-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Mar 17, 2025 at 04:00 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `crypto_recurring`
--

-- --------------------------------------------------------

--
-- Table structure for table `user_auth`
--

CREATE TABLE `user_auth` (
  `user_auth_id` bigint(20) NOT NULL,
  `user_auth_address` char(42) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
  `user_auth_token` char(128) NOT NULL,
  `user_auth_signature` char(132) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  `user_auth_created_at` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `user_auth_expire_at` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `user_auth_verify_at` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_operator`
--

CREATE TABLE `user_operator` (
  `user_operator` bigint(20) NOT NULL,
  `user_operator_address` char(42) NOT NULL,
  `user_operator_pk_encrypted` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_plan`
--

CREATE TABLE `user_plan` (
  `user_plan_id` bigint(20) NOT NULL,
  `user_plan_operator` char(42) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000' COMMENT 'will generate when user create a plan',
  `user_plan_vault` char(42) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000' COMMENT 'vault smart contract address',
  `user_plan_address` char(42) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
  `user_plan_name` varchar(200) NOT NULL,
  `user_plan_source_token` char(42) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
  `user_plan_destination_token` char(42) NOT NULL DEFAULT '0x0000000000000000000000000000000000000000',
  `user_plan_amount` decimal(36,18) NOT NULL DEFAULT 0.000000000000000000,
  `user_plan_frequency` int(10) NOT NULL DEFAULT 0 COMMENT 'in seconds',
  `user_plan_last_executed` datetime NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_plan_tx`
--

CREATE TABLE `user_plan_tx` (
  `user_plan_tx_id` bigint(20) NOT NULL,
  `user_plan_id` bigint(20) NOT NULL,
  `user_plan_tx_epoch` varchar(12) NOT NULL,
  `user_plan_tx_info` varchar(500) NOT NULL,
  `user_plan_tx_hash` char(66) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `user_auth`
--
ALTER TABLE `user_auth`
  ADD PRIMARY KEY (`user_auth_id`);

--
-- Indexes for table `user_operator`
--
ALTER TABLE `user_operator`
  ADD PRIMARY KEY (`user_operator`);

--
-- Indexes for table `user_plan`
--
ALTER TABLE `user_plan`
  ADD PRIMARY KEY (`user_plan_id`);

--
-- Indexes for table `user_plan_tx`
--
ALTER TABLE `user_plan_tx`
  ADD PRIMARY KEY (`user_plan_tx_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `user_auth`
--
ALTER TABLE `user_auth`
  MODIFY `user_auth_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_operator`
--
ALTER TABLE `user_operator`
  MODIFY `user_operator` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_plan`
--
ALTER TABLE `user_plan`
  MODIFY `user_plan_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_plan_tx`
--
ALTER TABLE `user_plan_tx`
  MODIFY `user_plan_tx_id` bigint(20) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
