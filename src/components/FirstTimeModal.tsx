
import { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

interface FirstTimeModalProps {
  onAccept: () => void;
  onClose: () => void;
}

const FirstTimeModal = ({ onAccept, onClose }: FirstTimeModalProps) => {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      onAccept();
    }
  };

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <AlertDialogTitle className="text-center gradient-text">Welcome to eBook Library</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Your digital companion for books and poetry
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 my-4">
          <p className="text-sm">
            By continuing to use this app, you agree to our:
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={accepted} 
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <label 
                htmlFor="terms" 
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  setAccepted(!accepted);
                }}
              >
                <span>
                  <Link to="/privacy" className="text-primary hover:underline" onClick={onClose}>
                    Privacy Policy
                  </Link> and <Link to="/terms" className="text-primary hover:underline" onClick={onClose}>
                    Terms & Conditions
                  </Link>
                </span>
              </label>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            This app utilizes third-party services and displays ads to provide its free services.
          </p>
        </div>
        
        <AlertDialogFooter className="flex flex-col space-y-2">
          <Button 
            className="w-full" 
            onClick={handleAccept}
            disabled={!accepted}
          >
            Accept & Continue
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => window.close()}>
            Exit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FirstTimeModal;
