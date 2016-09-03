#!/bin/bash

# Fetch data
URL="http://inst.eecs.berkeley.edu/~cs186/sp15/hw3_fec_data.zip"
wget -nc $URL
unzip -o hw3_fec_data.zip

# Drop database
dropdb --if-exists fec

# Create user and database
psql postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='rome_bop'" | grep -q 1 || createuser -d rome_bop;
createdb -U rome_bop -O rome_bop fec
psql -d fec -U rome_bop < schema.sql

BASE="$PWD/data"
TABLES=(candidates committee_contributions committees individual_contributions intercommittee_transactions linkages)

for table in ${TABLES[@]}
do
    psql -e -d fec -c "COPY ${table} FROM '$BASE/${table}.txt' DELIMITER '|' CSV;"
done

psql -e -d fec -c "ANALYZE"

# Cleanup
rm hw3_fec_data.zip
rm -rf data
