import asyncio
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime

@dataclass
class DataRecord:
    id: str
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class DataProcessor:
    def __init__(self):
        self.records: Dict[str, DataRecord] = {}
    
    async def create_record(self, data: Dict[str, Any]) -> DataRecord:
        record_id = str(uuid.uuid4())
        record = DataRecord(
            id=record_id,
            data=data,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.records[record_id] = record
        return record
    
    async def get_record(self, record_id: str) -> DataRecord:
        return self.records.get(record_id)
    
    async def update_record(self, record_id: str, new_data: Dict[str, Any]) -> DataRecord:
        if record_id not in self.records:
            raise ValueError(f"Record {record_id} not found")
        
        record = self.records[record_id]
        record.data.update(new_data)
        record.updated_at = datetime.now()
        return record
    
    async def delete_record(self, record_id: str) -> bool:
        if record_id in self.records:
            del self.records[record_id]
            return True
        return False
    
    async def get_all_records(self) -> List[DataRecord]:
        return list(self.records.values())
