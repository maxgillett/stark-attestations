#!/bin/bash

cairo-compile storage_proof.cairo \
    --output=storage_proof.json

cairo-run \
    --program=storage_proof.json \
    --print_info \
    --print_output \
    --layout=all \
    --memory_file=memory.bin \
    --program_input=proof.json \
    --trace_file=trace.bin
