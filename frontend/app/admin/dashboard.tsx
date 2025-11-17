import { EventType, UserInstructionType } from "@/lib/types";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";

interface EventInput {
  description: string;
  items: string[];
}

interface Agent {
  id: string;
  chapter_id: string;
  user_instruction: string;
  user_instruction_type?: UserInstructionType;
  agent_instructions: string;
  end_requirement: string;
  order: number;
  event_type?: EventType;
  event_input?: EventInput;
}

const AdminDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<Partial<Agent>>({});

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

  const fetchAgents = useCallback(() => {
    fetch(`${backendUrl}/api/admin/agents`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setAgents(data);
      })
      .catch(() => {
        console.error("Error fetching agents:", error);
      });
  }, [backendUrl]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleOpenDialog = (agent?: Agent) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData(agent);
    } else {
      setEditingAgent(null);
      setFormData({
        order: agents.length + 1,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAgent(null);
    setFormData({});
  };

  const handleSubmit = async () => {
    try {
      const url = editingAgent
        ? `${backendUrl}/api/admin/agents/${editingAgent.id}`
        : `${backendUrl}/api/admin/agents`;
      const method = editingAgent ? "PUT" : "POST";

      const data = { ...formData };
      if (data.user_instruction_type == "none") {
        delete data.user_instruction_type;
      }
      if (data.event_type == "none") {
        delete data.event_type;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchAgents();
        handleCloseDialog();
      }
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/agents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAgents();
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const moveAgent = useCallback(
    async (index: number, direction: "up" | "down") => {
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === agents.length - 1)
      ) {
        return;
      }

      const newIndex = direction === "up" ? index - 1 : index + 1;
      const newAgents = [...agents];
      const [movedAgent] = newAgents.splice(index, 1);
      newAgents.splice(newIndex, 0, movedAgent);

      // Update the order property for each agent
      const updatedAgents = newAgents.map((agent, idx) => ({
        ...agent,
        order: idx + 1,
      }));

      try {
        await fetch(`${backendUrl}/api/admin/agents/reorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agent_ids: updatedAgents.map((agent) => agent.id),
          }),
        });
        setAgents(updatedAgents);
      } catch (error) {
        console.error("Error reordering agents:", error);
      }
    },
    [agents, backendUrl]
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Agent Management
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        sx={{ mb: 3 }}
      >
        Add New Agent
      </Button>

      <List>
        {agents.map((agent, index) => (
          <ListItem key={agent.chapter_id} sx={{ mb: 2 }}>
            <Card sx={{ width: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {agent.order}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6">{agent.chapter_id}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {agent.user_instruction}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      onClick={() => moveAgent(index, "up")}
                      disabled={index === 0}
                      size="small"
                    >
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => moveAgent(index, "down")}
                      disabled={index === agents.length - 1}
                      size="small"
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton onClick={() => handleOpenDialog(agent)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(agent.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAgent ? "Edit Agent" : "Add New Agent"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Topic"
              value={formData.chapter_id || ""}
              onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
            />
            <TextField
              fullWidth
              label="Agent instructions"
              multiline
              rows={2}
              value={formData.agent_instructions || ""}
              onChange={(e) => setFormData({ ...formData, agent_instructions: e.target.value })}
              helperText="General instruction used to initialize Agent"
            />
            <TextField
              fullWidth
              label="First Message Instruction"
              multiline
              rows={3}
              value={formData.user_instruction || ""}
              onChange={(e) => setFormData({ ...formData, user_instruction: e.target.value })}
              helperText="Additional instructions for agent to generate first message only. Select DM instruction type below to post the first message literally."
            />

            <TextField
              fullWidth
              label="Instruction Type"
              select
              value={formData.user_instruction_type || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  user_instruction_type: e.target.value as UserInstructionType,
                })
              }
              SelectProps={{
                native: true,
              }}
            >
              <option value="none">None</option>
              <option value="dm">Direct Message</option>
            </TextField>

            <TextField
              fullWidth
              label="End Requirement"
              multiline
              rows={2}
              value={formData.end_requirement || ""}
              onChange={(e) => setFormData({ ...formData, end_requirement: e.target.value })}
              helperText='It should fit into the following sentence: "Sobald ... gehe weiter zum nächsten Kapitel". Use "SOFORT" to immediately go to next agent.'
            />
            <TextField
              fullWidth
              label="Event Type"
              select
              value={formData.event_type || ""}
              onChange={(e) =>
                setFormData({ ...formData, event_type: e.target.value as EventType })
              }
              SelectProps={{
                native: true,
              }}
            >
              <option value="none">None</option>
              <option value="swipe">Swipe</option>
              <option value="swipe2">Swipe2</option>
              <option value="rating">Rating</option>
              <option value="lifeline">Lifeline</option>
              <option value="evaluation">Evaluation</option>
            </TextField>
            {formData.event_type &&
              (formData.event_type == "swipe" ||
                formData.event_type == "swipe2" ||
                formData.event_type == "rating") && (
                <>
                  <TextField
                    fullWidth
                    label="Event Description"
                    value={formData.event_input?.description || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_input: {
                          description: e.target.value,
                          items: formData.event_input?.items || [],
                        },
                      })
                    }
                  />
                  <TextField
                    fullWidth
                    label="Event Items"
                    multiline
                    rows={4}
                    value={formData.event_input?.items?.join("\n") || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_input: {
                          description: formData.event_input?.description || "",
                          items: e.target.value.split("\n").filter(Boolean),
                        },
                      })
                    }
                    helperText="Enter each item on a new line. Press Enter to add a new item. Add images or ESCO skills with '[img-url]' or '<skill-uuid>'"
                    inputProps={{
                      style: { whiteSpace: "pre-wrap" },
                    }}
                  />
                </>
              )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAgent ? "Save Changes" : "Add Agent"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
