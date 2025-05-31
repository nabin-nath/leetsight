"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/apiClient";

export function FeedbackForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type == "") {
      toast.error("Select type");
      return;
    }

    if (title == "") {
      toast.error("Please enter title");
      return;
    }

    if (description == "") {
      toast.error("Please enter description");
      return;
    }

    const data = {
      type,
      title,
      description,
    };

    const sendFeedback = apiClient
      .post("/feedback", data)
      .then((response) => {
        // console.log("response", response);
        toast.success("Feedback sent successfully");

        setTitle("");
        setType("");
        setDescription("");
      })
      .catch((e) => {
        // console.log("error", e);
      });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-center">
            Let us know if you have any Feedback
          </CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <Label htmlFor="type">I would like to</Label>
                <Select required value={type} onValueChange={setType}>
                  <SelectTrigger className="w-[224px]">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Report a bug</SelectItem>
                    <SelectItem value="feature_request">
                      Request a feature
                    </SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="title">Title</Label>
                </div>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter title here"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="description">Description</Label>
                </div>
                <Textarea
                  id="description"
                  placeholder="Type your message here."
                  value={description}
                  required
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Submit
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
