import React, { useState } from 'react';
import {
  Button, Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  FileDownload, TableChart, Code, Description, Summarize
} from '@mui/icons-material';
import { getExportUrl } from '../services/surveyAPI';

interface Props {
  surveyId: number;
}

export default function ExportMenu({ surveyId }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleExport = (format: string) => {
    const url = getExportUrl(surveyId, format);
    window.open(url, '_blank');
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<FileDownload />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Export
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon><TableChart fontSize="small" /></ListItemIcon>
          <ListItemText>Export as CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('json')}>
          <ListItemIcon><Code fontSize="small" /></ListItemIcon>
          <ListItemText>Export as JSON</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('report')}>
          <ListItemIcon><Description fontSize="small" /></ListItemIcon>
          <ListItemText>Export as Report</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('summary')}>
          <ListItemIcon><Summarize fontSize="small" /></ListItemIcon>
          <ListItemText>Export Summary</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
