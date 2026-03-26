create database if not exists jenie;
use jenie;

create table if not exists user(
    id int auto increment primary key,
    username varchar(50) not null unique,
    password varchar(50) not null,
    role varchar(50) not null,
    name varchar(50) not null,
    email varchar(50) unique,
    phone_number varchar(10) unique
);

create table if not exists tax_slabs(
    id int auto increment primary key,
    year int not null,
    min_income int not null,
    max_income int,
    tax_rate int not null
);
